"use strict";

const dbConf = require("../conf/db.json");
const fs = require("fs");
const mkdir = require("mkdirp").sync;

const DbService = require("moleculer-db");

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = function(collection) {
    const cacheCleanEventName = `cache.clean.${collection}`;

    const schema = {
        mixins: [DbService],

        events: {
            /**
             * Subscribe to the cache clean event. If it's triggered
             * clean the cache entries for this service.
             *
             * @param {Context} ctx
             */
            async [cacheCleanEventName]() {
                if (this.broker.cacher) {
                    await this.broker.cacher.clean(`${this.fullName}.*`);
                }
            },
        },

        methods: {
            /**
             * Send a cache clearing event when an entity changed.
             *
             * @param {String} type
             * @param {any} json
             * @param {Context} ctx
             */
            async entityChanged(type, json, ctx) {
                ctx.broadcast(cacheCleanEventName);
            },
        },

        async started() {
            // Check the count of items in the DB. If it's empty,
            // call the `seedDB` method of the service.
            if (this.seedDB) {
                const count = await this.adapter.count();
                if (count == 0) {
                    this.logger.info(
                        `The '${collection}' collection is empty. Seeding the collection...`
                    );
                    await this.seedDB();
                    this.logger.info(
                        "Seeding is done. Number of records:",
                        await this.adapter.count()
                    );
                }
            }
        },
    };

    if (process.env.MONGO_URI || dbConf.mongodb.uri) {
        // Mongo adapter
        const MongoAdapter = require("moleculer-db-adapter-mongo");
        const uri = process.env.MONGO_URI || dbConf.mongodb.uri;

        schema.adapter = new MongoAdapter(uri, { useUnifiedTopology: true });
        schema.collection = collection;
    } else if (process.env.TEST) {
        // NeDB memory adapter for testing
        schema.adapter = new DbService.MemoryAdapter();
    } else {
        // NeDB file DB adapter

        // Create data folder
        const dbPath = "./DB/mongodb-mem";
        if (!fs.existsSync(dbPath)) {
            mkdir(dbPath);
        }

        schema.adapter = new DbService.MemoryAdapter({
            filename: dbPath + `${collection}.db`,
        });
    }

    return schema;
};

"use strict";
const MongoDBAdapter = require("../db/mongo.adapter");

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
    name: "messages",
    settings: {},
    dependencies: [],
    mixins: [],
    actions: {
        list: {
            params: {
                limit: { type: "number", optional: true, convert: true },
                offset: { type: "number", optional: true, convert: true },
                conversation: "string"
            },
            async handler(ctx) {
                let { limit, offset, conversation, id } = ctx.params;
                limit = limit ? limit : 20;
                offset = offset ? offset : 0;
                const dbCollection = await this.getDBCollection(conversation);

                // Get specified message
                if (id != null && id != undefined && id != null) {
                    return await dbCollection.findById(id);
                }
                // Get list of message
                const filter = {
                    limit,
                    offset,
                    sort: ["-createdTime"],
                    query: {}
                };

                return this.convertEntitiesToResults(await dbCollection.find(filter));
            }
        },
        create: {
            params: {
                conversation: "string",
                body: {
                    type: "object",
                    props: {
                        type: { type: "string" },
                        content: "object"
                    }
                },
                from: {
                    type: "object",
                    props: {
                        issuer: { type: "number", convert: true }
                    }
                }
            },
            async handler(ctx) {
                const { conversation, from, body } = ctx.params;
                const entity = {
                    from,
                    body,
                    modification: []
                };

                const dbCollection = await this.getDBCollection(conversation);
                return this.convertEntitiesToResults(await dbCollection.insert(entity));
            }
        }
    },

    /**
     * Events
     */
    events: {},

    /**
     * Methods
     */
    methods: {
        async getDBCollection(collection) {
            if (!this.dbCollections[collection]) {
                const dbCl = MongoDBAdapter(collection, this);
                this.dbCollections[collection] = dbCl;
                this.logger.info("Created collection adapter:", collection);
                await dbCl.connect();
                return dbCl;
            }
            return this.dbCollections[collection];
        },
        convertEntitiesToResults(entity) {
            let updateIdFn = (ent) => {
                ent.id = ent._id;
                delete ent._id;
                return ent;
            };

            if (!Array.isArray(entity)) {
                return updateIdFn(entity);
            }

            return entity.map(updateIdFn);
        }
    },

    /**
     * Service created lifecycle event handler
     */
    created() {
        this.dbCollections = {};
    },

    /**
     * Service started lifecycle event handler
     */
    async started() {},

    /**
     * Service stopped lifecycle event handler
     */
    async stopped() {
        this.dbCollections.forEach(db => {
            db.disconnect();
        });
    }
};

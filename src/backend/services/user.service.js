"use strict";
const authConf = require("../conf/auth.json");
const MongoDBAdapter = require("../db/mongo.adapter");
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
    name: "user",
    version: 1,
    settings: {},
    dependencies: [],
    mixins: [],
    actions: {
        update: {
            params: {
                user: "object"
            },
            async handler(ctx) {
                const { user } = ctx.params;
                user.updated = new Date();
    
                const oldEntity = await this.dbCollection.findOne({id: user.id});
                if (oldEntity) {
                    // Update
                    const update = {
                        $set: user
                    };
                    return await this.dbCollection.updateById(oldEntity._id, update);
                }
                return this.dbCollection.insert(user);
            }
        },
        getUser: {
            auth: true,
            roles: [1],
            rest: "GET /:id",
            params: {
                id: "string"
            },
            async handler(ctx) {
                let { id } = ctx.params;
                const entity = await this.dbCollection.findOne({id});

                delete entity._id;
                delete entity.refreshToken;
                return entity;
            }
        },
    },

    /**
     * Events
     */
    events: {},

    /**
     * Methods
     */
    methods: {
    },

    /**
     * Service created lifecycle event handler
     */
    created() {
        this.dbCollection = MongoDBAdapter(authConf.db.collection, this);
        this.dbCollection.connect();
    },

    /**
     * Service started lifecycle event handler
     */
    async started() {},

    /**
     * Service stopped lifecycle event handler
     */
    stopped() {
        return this.dbCollection.disconnect();
    }
};

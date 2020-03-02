"use strict";
const authConf = require("../conf/auth.json");
const MongoDBAdapter = require("../db/mongo.adapter");
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
    name: "users",
    version: 1,
    settings: {},
    dependencies: [],
    mixins: [],
    actions: {
        update: {
            visibility: "public",
            params: {
                user: "object"
            },
            async handler(ctx) {
                const { user, refreshToken } = ctx.params;
                const entity = {
                    updated: new Date(),
                    refreshToken
                };
    
                const oldEntity = await this.dbCollection.findOne({"payload.id": user.id});
                if (oldEntity) {
                    entity.payload = oldEntity.payload;
                    Object.assign(entity.payload, user);
                    delete entity._id;
                    // Update
                    const update = {
                        $set:entity
                    };
                    return await this.dbCollection.updateById(oldEntity._id, update);
                }
                // Add new one
                entity.payload = { ...user };
                if (!entity.payload.role) {
                    entity.payload.role = 1;
                }
                return await this.dbCollection.insert(entity);
            }
        },
        getUserEntity: {
            visibility: "public",
            params: {
                id: "string"
            },
            async handler(ctx) {
                let { id } = ctx.params;
                const entity = await this.dbCollection.findOne({"payload.id": id});
                return entity;
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
                const entity = await this.dbCollection.findOne({"payload.id": id});
                return entity ? entity.payload : null;
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

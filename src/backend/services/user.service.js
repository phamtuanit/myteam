"use strict";
const DBCollectionService = require("../mixins/collection.db.mixin");
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
    name: "users",
    version: 1,
    settings: {},
    dependencies: [],
    mixins: [DBCollectionService],
    actions: {
        addUser: {
            auth: true,
            roles: [1],
            rest: "POST /",
            params: {
                user: "object"
            },
            handler(ctx) {
                const { user } = ctx.params;
                return this.addOrUpdateUser(user);
            }
        },
        getUser: {
            auth: true,
            roles: [1],
            rest: "GET /",
            async handler() {
                const dbCollection = await this.getDBCollection("users");
                return dbCollection.find().then(users => {
                    if (users) {
                        users.forEach(user => {
                            delete user._id;
                        });
                    }
                    return users;
                });
            }
        },
        getUserById: {
            auth: true,
            roles: [1],
            rest: "GET /:id",
            params: {
                id: "string"
            },
            async handler(ctx) {
                const { id } = ctx.params;
                const dbCollection = await this.getDBCollection("users");
                return dbCollection.findOne({ id }).then(user => {
                    if (user) {
                        delete user._id;
                    }
                    return user;
                });
            }
        }
    },

    /**
     * Events
     */
    events: {
        // [NodeID].user.disconnected
        "*.user.login"(user) {
            return this.addOrUpdateUser(user);
        }
    },

    /**
     * Methods
     */
    methods: {
        async addOrUpdateUser(user, addOnly = false) {
            const dbCollection = await this.getDBCollection("users");
            const existingUser = await dbCollection.findOne({
                id: user.id
            });
            if (!existingUser) {
                user.created = new Date();
                return await dbCollection.insert(user).then(entity => {
                    delete entity._id;
                    return entity;
                });
            } else if (!addOnly) {
                user.updated = new Date();
                const update = {
                    $set: user
                };
                return await dbCollection
                    .updateById(existingUser._id, update)
                    .then(en => {
                        delete en._id;
                        return en;
                    });
            }
        }
    },

    /**
     * Service created lifecycle event handler
     */
    created() {},

    /**
     * Service started lifecycle event handler
     */
    started() {},

    /**
     * Service stopped lifecycle event handler
     */
    stopped() {}
};

"use strict";
const DBCollectionService = require("../mixins/collection.db.mixin");
const { cleanDbMark } = require("../utils/entity");
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
                user: "object",
            },
            handler(ctx) {
                const { user } = ctx.params;
                return this.addOrUpdateUser(user);
            },
        },
        getUserById: {
            auth: true,
            roles: [1],
            rest: "GET /:id",
            params: {
                id: "string",
            },
            async handler(ctx) {
                const { id } = ctx.params;
                const dbCollection = await this.getDBCollection("users");
                return dbCollection.findOne({ id }).then(cleanDbMark);
            },
        },
        getUser: {
            auth: true,
            roles: [1],
            rest: "GET /",
            params: {
                user: { type: "string", optional: true },
                text: { type: "string", optional: true },
            },
            async handler(ctx) {
                const { user, text } = ctx.params;
                const dbCollection = await this.getDBCollection("users");

                const filter = {
                    query: {},
                };

                // query by given user
                if (user) {
                    const users = user.split(",");
                    if (users.length > 0) {
                        filter.query.id = {
                            $in: users,
                        };
                    } else {
                        filter.query.id = {
                            $in: user,
                        };
                    }
                }

                // Text search
                if (text) {
                    filter.search = text;
                }

                const result = await dbCollection.find(filter);

                // Delete _id and get status
                if (result) {
                    const userIds = result.map(i => i.id);
                    const statusList = await ctx.call("v1.live.getUserById", {
                        userId: userIds,
                    });

                    for (let index = 0; index < result.length; index++) {
                        const userInfo = result[index];
                        cleanDbMark(userInfo);
                        userInfo.status = statusList[index].status;
                    }
                }

                return result;
            },
        },
    },

    /**
     * Events
     */
    events: {
        // user.disconnected
        "user.login"(user) {
            return this.addOrUpdateUser(user);
        },
    },

    /**
     * Methods
     */
    methods: {
        async addOrUpdateUser(user, addOnly = false) {
            const dbCollection = await this.getDBCollection("users");
            const existingUser = await dbCollection.findOne({
                id: user.id,
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
                    $set: user,
                };
                return await dbCollection
                    .updateById(existingUser._id, update)
                    .then(cleanDbMark);
            }
        },
    },

    /**
     * Service created lifecycle event handler
     */
    created() {},

    /**
     * Service started lifecycle event handler
     */
    async started() {
        const dbCollection = await this.getDBCollection("users");
        dbCollection.collection.createIndex({
            firstName: "text",
            lastNme: "text",
            mail: "text",
            phone: "text",
        });
    },

    /**
     * Service stopped lifecycle event handler
     */
    stopped() {},
};

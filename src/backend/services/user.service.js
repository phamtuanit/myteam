"use strict";
const Errors = require("moleculer").Errors;
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
            roles: [0],
            rest: "POST /",
            params: {
                user:{
                    type: "object",
                    props: {
                        userName: "string",
                        firstName: "string",
                        lastName: "string",
                        fullName: "string",
                    }
                }
            },
            handler(ctx) {
                const { user } = ctx.params;
                return this.addOrUpdateUser(user);
            },
        },
        updateUser: {
            auth: true,
            roles: [0],
            rest: "PUT /:id",
            params: {
                id: "string",
                user: "object",
            },
            handler(ctx) {
                const { user, id } = ctx.params;
                user.id = id;
                return this.addOrUpdateUser(user);
            },
        },
        getUserById: {
            auth: true,
            roles: [-1],
            rest: "GET /:id",
            cache: true,
            params: {
                id: "string",
            },
            async handler(ctx) {
                const id = ctx.params.id;
                const dbCollection = await this.getDBCollection("users");
                const user = await dbCollection.findOne({ id }).then(cleanDbMark);
                if (!user) {
                    const appDBCollection = await this.getDBCollection("applications");
                    const app = await appDBCollection.findOne({ id: id }).then(cleanDbMark);
                    if (app) {
                        app.application = true;
                        app.fullName = app.name || app.fullName;
                    }
                }
                return user;
            },
        },
        getUser: {
            auth: true,
            roles: [-1],
            rest: "GET /",
            cache: true,
            params: {
                user: { type: "string", optional: true },
                text: { type: "string", optional: true },
                limit: {
                    type: "number",
                    optional: true,
                    convert: true,
                    default: undefined,
                },
            },
            async handler(ctx) {
                const { user, text, limit } = ctx.params;
                const { user: loggedUser } = ctx.meta;

                if (!text && !user && loggedUser.role != 0) {
                    throw new Errors.RequestRejectedError("You don't have permission to get all users.", 403);
                }

                let dbCollection = await this.getDBCollection("users");
                const filter = {
                    query: {},
                };

                if (limit) {
                    filter.limit = limit;
                }

                // query by given user
                if (user) {
                    const users = user.split(",");
                    filter.query.id = {
                        $in: users,
                    };
                }

                // Text search
                if (text) {
                    filter.search = text;
                }

                // Find users
                const result = await dbCollection.find(filter);
                // Find application
                dbCollection = await this.getDBCollection("applications");
                let apps = await dbCollection.find(filter).then(cleanDbMark);
                if (apps) {
                    apps = apps.map(app => {
                        app.fullName = app.name || app.fullName;
                        app.application = true;
                        app.status = "on";
                        delete app.endpoint;
                        delete app.owner;
                        return app;
                    });
                    result.push(...apps);
                }

                // Delete _id and get status
                if (result) {
                    const usersList = result.filter(u => !u.application);
                    const userIds = usersList.map((i) => i.id);
                    if (userIds && userIds.length > 0) {
                        const statusList = await ctx.call("v1.live.getUserById", { userId: userIds, });
    
                        for (let index = 0; index < usersList.length; index++) {
                            const userInfo = usersList[index];
                            cleanDbMark(userInfo);
                            userInfo.status = statusList[index].status;
                        }
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
            this.broker.cacher.clean(`*.users.*${user.id}*`);
            return this.addOrUpdateUser(user);
        },
    },

    /**
     * Methods
     */
    methods: {
        async addOrUpdateUser(user) {
            const dbCollection = await this.getDBCollection("users");
            const existingUser = await dbCollection.findOne({id: user.id,});

            if (!existingUser) {
                user.created = new Date();
                user.role = 10; // Normal member
                return await dbCollection.insert(user).then((entity) => {
                    delete entity._id;
                    return entity;
                });
            } else {
                if (typeof existingUser.role === "undefined") {
                    user.role = 10; // Normal member. TODO: to be delete when all users has role
                }

                user.updated = new Date();
                const update = {
                    $set: user,
                };
                return await dbCollection.updateById(existingUser._id, update).then((user) => {
                    this.broker.cacher.clean("*.users.*");
                    return cleanDbMark(user);
                });
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
        await this.getDBCollection("users").then(dbCollection => {
            dbCollection.collection.createIndex({
                firstName: "text",
                lastName: "text",
                fullName: "text",
                mail: "text",
                phone: "text",
            });
        });

        await this.getDBCollection("applications").then(dbCollection => {
            dbCollection.collection.createIndex({
                name: "text",
                owner: "text",
            });
        });
    },

    /**
     * Service stopped lifecycle event handler
     */
    stopped() {},
};

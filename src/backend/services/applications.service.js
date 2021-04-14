"use strict";
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const Errors = require("moleculer").Errors;
const DBCollectionService = require("../mixins/collection.db.mixin");
const { cleanDbMark } = require("../utils/entity");

const keyPath = path.resolve(__dirname, "../ssl/jwt.private.pem");
const privateKey = fs.readFileSync(keyPath);
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
    name: "applications",
    version: 1,
    settings: {},
    dependencies: [],
    mixins: [DBCollectionService],
    actions: {
        addApp: {
            auth: true,
            roles: [-1],
            rest: "POST /",
            params: {
                app: {
                    type: "object",
                    props: {
                        name: { type: "string" },
                        type: { type: "string", optional: true },
                        role: { type: "number", convert: true, default: 15 },
                        disabled: { type: "boolean", convert: true, default: false },
                        endpoint: {
                            type: "object",
                            optional: true,
                            props: {
                                enable: { type: "boolean", convert: true, default: true },
                                type: { type: "string", default: "webhook" },
                                uri: { type: "string", optional: true },
                                http_method: { type: "string", optional: true },
                                auto_resolve: { type: "boolean", default: true },
                                settings: { type: "object", default: {} },
                            },
                        }
                    },
                },
            },
            handler(ctx) {
                const { app } = ctx.params;
                const { user } = ctx.meta;
                app.owner = user.id;
                delete app.id; // Remove id if any
                return this.addOrUpdateApp(app).then(cleanDbMark);
            },
        },
        updateApp: {
            auth: true,
            roles: [-1],
            rest: "PUT /:id",
            params: {
                app: "object",
                id: { type: "string", convert: true },
                role: { type: "number", convert: true, optional: true },
                disabled: { type: "boolean", convert: true, default: false, optional: true },
                endpoint: {
                    type: "object",
                    optional: true,
                    props: {
                        enable: { type: "boolean", convert: true, optional: true },
                        type: { type: "string", optional: true },
                        uri: { type: "string", optional: true },
                        http_method: { type: "string", optional: true },
                        auto_resolve: { type: "boolean", optional: true },
                        settings: { type: "object", optional: true},
                    },
                },
            },
            handler(ctx) {
                const { app, id } = ctx.params;
                if (!app.id && !id) {
                    throw new Errors.ValidationError("Missing application id");
                }
                app.id = id || app.id;
                return this.addOrUpdateApp(app).then(cleanDbMark);
            },
        },
        deleteApp: {
            auth: true,
            roles: [-1],
            rest: "DELETE /:id",
            params: {
                id: { type: "string", convert: true }
            },
            async handler(ctx) {
                const { id } = ctx.params;
                const dbCollection = await this.getDBCollection("applications");
                const appInfo = await dbCollection.findOne({ id });

                // 1. Verify existing message
                if (!appInfo) {
                    // The message not found
                    this.logger.info("The application could not be found.");
                    return;
                }

                const { user } = ctx.meta;
                if (user.id !== appInfo.owner) {
                    this.logger.warn(`${user.id} is not owner of the application.`);
                    throw new Errors.MoleculerError(`${user.id} is not owner of the application.`, 401);
                }

                // 2. Delete record
                appInfo.deleted = new Date();
                await dbCollection.removeById(appInfo._id).catch(this.logger.error).then(cleanDbMark);
                return appInfo;
            },
        },
        getAppById: {
            auth: true,
            roles: [-1],
            rest: "GET /:id",
            cache: true,
            params: {
                id: { type: "string", convert: true }
            },
            async handler(ctx) {
                const { id } = ctx.params;
                const dbCollection = await this.getDBCollection("applications");
                return await dbCollection.findOne({ id }).then(app => {
                    const { user } = ctx.meta;
                    if (app && user.role > 2) {
                        delete app.endpoint;
                        delete app.owner;
                    }
                    return cleanDbMark(app);
                });
            },
        },
        getAppByIdLocal: {
            visibility: "public",
            cache: true,
            params: {
                id: { type: "string", convert: true }
            },
            async handler(ctx) {
                const { id } = ctx.params;
                const dbCollection = await this.getDBCollection("applications");
                return await dbCollection.findOne({ id });
            },
        },
        getToken: {
            auth: true,
            roles: [-1],
            rest: "GET /token/:id",
            params: {
                id: { type: "string", convert: true }
            },
            async handler(ctx) {
                const { user } = ctx.meta;
                const { id: appId } = ctx.params;
                const dbCollection = await this.getDBCollection("applications");
                const appInfo = await dbCollection.findOne({ id: appId }).then(cleanDbMark);

                if (!appInfo) {
                    this.logger.warn(`Application ${appId} could not be found.`);
                    throw new Errors.MoleculerError(`Application ${appId} could not be found.`);
                }

                if (user.role > 2) {
                    this.logger.warn(`${user.id} is not owner of the application.`);
                    throw new Errors.MoleculerError(`${user.id} is not owner of the application.`, 401);
                }

                return this.getAppToken(appInfo);
            },
        },
    },

    /**
     * Events
     */
    events: { },

    /**
     * Methods
     */
    methods: {
        getAppToken(appInfo) {
            const token = this.generateJWT(appInfo);
            return {
                token: token,
                app: appInfo,
            };
        },
        generateJWT(data) {
            const payload = { data };
            payload.id = Date.now(),
            payload.created = Date.now();
            return jwt.sign(payload, privateKey);
        },
        async addOrUpdateApp(app) {
            const dbCollection = await this.getDBCollection("applications");

            if (!app.id) {
                app.id = String(Date.now());
                app.created = new Date();
                app.role = 15; // default
                app.type =  app.type || "sender"; // default

                if (app.type === "bot" && !app.endpoint) {
                    app.endpoint = {
                        enable: false,
                        auto_resolve: true,
                        settings: null
                    };
                }
                return await dbCollection.insert(app).catch(this.logger.error);
            } else {
                const existingApp = await dbCollection.findOne({ id: app.id, });
                if (!existingApp.role) {
                    app.role = 15; // default
                } else {
                    delete app.role;
                }

                app.updated = new Date();
                const update = {
                    $set: app,
                };
                return await dbCollection.updateById(existingApp._id, update).catch(this.logger.error);
            }
        },
    },

    /**
     * Service created lifecycle event handler
     */
    created() { },

    /**
     * Service started lifecycle event handler
     */
    started() {},

    /**
     * Service stopped lifecycle event handler
     */
    stopped() { },
};

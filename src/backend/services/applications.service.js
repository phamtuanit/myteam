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
                        type: { type: "string", optional: true }
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
                id: { type: "string", convert: true }
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
                return await dbCollection.findOne({ id }).then(cleanDbMark);
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

                if (user.id !== appInfo.owner) {
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
                app.type = "sender"; // default
                return await dbCollection.insert(app).catch(this.logger.error);
            } else {
                const existingApp = await dbCollection.findOne({ id: app.id, });
                if (!existingApp.role || app.role < 15) {
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

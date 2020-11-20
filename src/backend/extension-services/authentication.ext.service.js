"use strict";
const { MoleculerClientError } = require("moleculer").Errors;
const DBCollectionService = require("../mixins/collection.db.mixin");

const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

const keyPath = path.resolve(__dirname, "../ssl/jwt.private.pem");
const privateKey = fs.readFileSync(keyPath);

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
    name: "extensions.auth",
    version: 1,
    settings: {},
    dependencies: ["v1.applications"],
    mixins: [DBCollectionService],
    actions: {
        verifyToken: {
            visibility: "public",
            params: {
                token: { type: "string" },
            },
            async handler(ctx) {
                const token = ctx.params.token || ctx.meta.token;
                // Check token
                if (!token) {
                    throw new MoleculerClientError("No application token!", 401);
                }

                try {
                    // Verify token
                    const decoded = await jwt.verify(token, privateKey);
                    // Check expiration date
                    const appInfo = decoded.data;
                    appInfo.isApplication = true;
                    this.logger.debug("Application is verified:", appInfo.id);
                    return appInfo;
                } catch (error) {
                    this.logger.warn(error);
                    throw error;
                }
            },
        },
    },

    /**
     * Events
     */
    events: {},

    /**
     * Methods
     */
    methods: { },

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
    stopped() {},
};

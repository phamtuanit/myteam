"use strict";
const {
    MoleculerClientError,
} = require("moleculer").Errors;
const DBCollectionService = require("../mixins/collection.db.mixin");

const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

const keyPath = path.resolve(__dirname, "../keys/server.private.pem");
const privateKey = fs.readFileSync(keyPath);

const authConf = require("../conf/auth.json");

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
    name: "auth",
    version: 1,
    settings: {},
    dependencies: [],
    mixins: [DBCollectionService],
    actions: {
        verifyToken: {
            rest: "POST /verify",
            params: {
                token: { type: "string", optional: true }
            },
            async handler(ctx) {
                const token = ctx.params.token || ctx.meta.token;
                if (!token) {
                    throw new MoleculerClientError("Token is missing.");
                }
                try {
                    const decoded = await jwt.verify(token, privateKey);
                    if (decoded.forRefresh == true) {
                        // The token is refresh-token
                        throw new MoleculerClientError(
                            "Token cannot be accepted. Considering to use right access token."
                        );
                    }

                    const user = decoded.data;
                    const today = new Date();
                    const expirationDate = new Date(decoded.exp);
                    if (today > expirationDate) {
                        throw new MoleculerClientError("Token is expired");
                    }
                    this.logger.debug("Logged in user:", user.id);
                    return user;
                } catch (error) {
                    this.logger.error(error);
                    error.code = 401;
                    throw error;
                }
            }
        },
        login: {
            rest: "POST /login",
            async handler(ctx) {
                const username = ctx.meta.headers["user-name"];
                let password = ctx.meta.headers["user-pass"];

                if (username && password) {
                    const passBuf = new Buffer.from(password, "base64");
                    password = passBuf.toString();

                    // Search user info
                    const user = await this.ldap.verify(username, password);
                    const userToken = this.getUserToken(user);

                    // Inform user login
                    const eventName = `user.login`;
                    await this.broker.emit(eventName, user, ["users"]);
                    return userToken;
                } else {
                    throw new MoleculerClientError(
                        "Missing user name or password",
                        400
                    );
                }
            }
        },
        refreshToken: {
            rest: "POST /renew-token",
            async handler(ctx) {
                const { token } = ctx.meta;
                try {
                    const decoded = await jwt.verify(token, privateKey);
                    if (decoded.forRefresh != true) {
                        // The token is refresh-token
                        throw new MoleculerClientError(
                            "Token cannot be accepted. Considering to use refresh access token."
                        );
                    }

                    const today = new Date();
                    const expirationDate = new Date(decoded.exp);
                    if (today > expirationDate) {
                        throw new MoleculerClientError("Token is expired");
                    }

                    const user = decoded.data;
                    const userToken = this.getUserToken(user);
                    return userToken;
                } catch (error) {
                    this.logger.error(error);
                    error.code = 401;
                    throw error;
                }
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
        getUserToken(user) {
            const { token, exp } = this.generateJWT(user);
            const refreshToken = this.generateJWT(user, true).token;
            return {
                token: {
                    user,
                    access: token,
                    exp,
                    refresh: refreshToken
                }
            };
        },
        /**
         * Generate JWT
         *
         * @param {*} user The user information
         * @returns Token
         */
        generateJWT(user, forRefresh = false) {
            const now = new Date();
            const expirationDate = new Date(now);
            expirationDate.setDate(now.getDate() + authConf.expiration.maxDate);

            const payload = { data: { ...user } };
            if (forRefresh == true) {
                payload.forRefresh = true;
                expirationDate.setDate(expirationDate.getDate() + 5);
            }
            const exp = Math.floor(expirationDate.getTime());
            payload.created = new Date().getTime();
            payload.exp = exp;
            const token = jwt.sign(payload, privateKey);
            return {
                token,
                exp
            };
        },
    },

    /**
     * Service created lifecycle event handler
     */
    created() {
        const ldap = require("../ldap-wrapper/ldap.adapter.js");
        this.ldap = new ldap(this.logger);
    },

    /**
     * Service started lifecycle event handler
     */
    started() { },

    /**
     * Service stopped lifecycle event handler
     */
    stopped() {
        this.ldap.close();
    }
};

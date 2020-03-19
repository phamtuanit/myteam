"use strict";
const {
    MoleculerClientError,
    ServiceNotAvailableError,
    MoleculerServerError
} = require("moleculer").Errors;
const DBCollectionService = require("../mixins/collection.db.mixin");

const ldap = require("ldapjs");
const fs = require("fs");
const path = require("path");
const authConf = require("../conf/auth.json");
// const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const privateKey = fs.readFileSync(
    path.resolve(__dirname, "../keys/server.private.pem")
);

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
            visibility: "public",
            params: {
                token: "string"
            },
            async handler(ctx) {
                const { token } = ctx.params;
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
                    const user = await this.verifyUser(username, password);
                    const userToken = this.getUserToken(user);

                    // Inform user login
                    const eventName = `${this.broker.nodeID}.user.login`;
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
            const refreshToken = this.generateJWT(user,  true).token;
            return {
                token: {
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
        confirmLdap() {
            if (!this.ldapClient) {
                try {
                    this.ldapClient = ldap.createClient({
                        url: authConf.server
                    });
                    return true;
                } catch (error) {
                    this.logger.error(error);
                    this.ldapClient = null;
                    return false;
                }
            }
            return true;
        },
        verifyUser(userName, password) {
            if (!this.confirmLdap()) {
                return Promise.reject(
                    new ServiceNotAvailableError(
                        "Could not connect to LDAP server"
                    )
                );
            }

            return new Promise((resolve, reject) => {
                this.ldapSearch("", userName).then(users => {
                    const user = users[0];
                    this.ldapClient.bind(user.dn, password, err => {
                        if (err) {
                            reject(new MoleculerServerError(err));
                        } else {
                            resolve(user);
                        }
                    });
                });
            });
        },
        ldapSearch(dn, userName) {
            if (!this.confirmLdap()) {
                return Promise.reject(
                    new ServiceNotAvailableError(
                        "Could not connect to LDAP server"
                    )
                );
            }

            let dnSearch;
            let filter;
            if (!dn) {
                dnSearch = `ou=Dev,dc=common,dc=com`;
                filter = { filter: `(uid=${userName})`, scope: "sub" };
            } else {
                dnSearch = dn;
                filter = { scope: "sub" };
            }

            return new Promise((resolve, reject) => {
                this.ldapClient.search(dnSearch, filter, (err, res) => {
                    if (err) {
                        this.logger.error("ERROR: " + err);
                        reject(
                            new MoleculerClientError(
                                "Cannot recognize user. " + err
                            )
                        );
                        return;
                    }

                    const searchList = [];
                    res.on("searchEntry", function(entry) {
                        searchList.push(entry);
                    });
                    res.on("error", function(err) {
                        reject(new MoleculerServerError(err.message));
                    });
                    res.on("end", () => {
                        if (searchList.length >= 1) {
                            const users = [];
                            searchList.forEach(item => {
                                const ldapUser = item.object;
                                const userInfo = {
                                    id: ldapUser.uid,
                                    username: ldapUser.uid,
                                    firstname: ldapUser.givenName,
                                    lastname: ldapUser.sn,
                                    mail: ldapUser.mail,
                                    dn: ldapUser.dn,
                                    phone: ldapUser.telephoneNumber
                                };
                                users.push(userInfo);
                            });

                            resolve(users);
                        } else {
                            reject(
                                new MoleculerClientError(
                                    "Cannot recognize user"
                                )
                            );
                        }
                    });
                });
            });
        },
    },

    /**
     * Service created lifecycle event handler
     */
    created() {
        this.ldapClient = null;
    },

    /**
     * Service started lifecycle event handler
     */
    async started() {},

    /**
     * Service stopped lifecycle event handler
     */
    async stopped() {}
};

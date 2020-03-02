"use strict";
const {
    MoleculerClientError,
    ServiceNotAvailableError,
    MoleculerServerError
} = require("moleculer").Errors;
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
    mixins: [],
    actions: {
        verifyToken: {
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
                            "Token cannot be accepted"
                        );
                    }

                    const user = decoded.data;
                    this.logger.info("Logged in user:", user);
                    const today = new Date();
                    const expirationDate = new Date(decoded.exp);
                    if (today > expirationDate) {
                        throw new MoleculerClientError("Token is expired");
                    }
                    return user;
                } catch (error) {
                    throw new MoleculerClientError(error);
                }
            }
        },
        login: {
            rest: "POST /login",
            params: {},
            async handler(ctx) {
                const { username } = ctx.meta.headers;
                let password = ctx.meta.headers.password;
                const passBuf = new Buffer.from(password, "base64");
                password = passBuf.toString();

                // Search user info
                const user = await this.verifyUser(username, password);
                const token = this.generateJWT(user);
                const refreshToken = this.generateJWT(
                    { id: user.id, created: new Date().getTime() },
                    true
                );
                // Update DB
                await this.broker.call("v1.user.update", {
                    refreshToken,
                    user
                });
                return {
                    token: {
                        access: token,
                        refresh: refreshToken
                    }
                };
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
            payload.created = new Date().getTime();
            payload.exp = Math.floor(expirationDate.getTime());
            return jwt.sign(payload, privateKey);
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
        }
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
    async stopped() {
        this.dbCollections.forEach(db => {
            db.disconnect();
        });
    }
};
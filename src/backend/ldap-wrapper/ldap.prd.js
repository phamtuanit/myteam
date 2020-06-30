const {
    MoleculerClientError,
    ServiceNotAvailableError,
    MoleculerServerError,
} = require("moleculer").Errors;
const ldap = require("ldapjs");
const authConf = require("../conf/auth.json");

const service = function (logger) {
    this.logger = logger || console;
    this.ldapClient = null;
};

service.prototype = {
    close() {
        if (this.ldapClient) {
            this.logger.info("Close LDAP connection.");
            this.ldapClient.destroy();
            this.ldapClient = null;
        }
    },
    async confirmLdap() {
        if (!this.ldapClient || (!this.ldapClient.connected && !this.ldapClient.connecting)) {
            return await new Promise((resolve) => {
                this.ldapClient = ldap.createClient({
                    url: authConf.server,
                });

                this.ldapClient.on("connect", () => {
                    this.logger.info("LDAP connection is ready.");
                    resolve(true);

                    this.ldapClient.on("error", (err) => {
                        this.logger.error("LDAP connection has problem.", err);
                        this.close();
                    });
                });

                this.ldapClient.once("error", (err) => {
                    this.logger.error("Could not connect to LDAP.", err);
                    this.close();
                    resolve(false);
                });
            });
        }
        return true;
    },
    async verify(userName, password) {
        return await new Promise((resolve, reject) => {
            this.search("", userName).then((users) => {
                const user = users[0];
                this.ldapClient.bind(user.dn, password, (err) => {
                    if (err) {
                        reject(
                            new MoleculerClientError(
                                "Username or Password is not correct.",
                                401
                            )
                        );
                    } else {
                        resolve(user);
                    }
                });
            }).catch(reject);
        });
    },
    async search(dn, userName) {
        if (!(await this.confirmLdap())) {
            throw new MoleculerServerError("Could not connect to LDAP server");
        }

        let dnSearch;
        let filter;
        if (!dn) {
            dnSearch = authConf.rootDn;
            filter = {
                filter: `(${authConf.idMap}=${userName})`,
                scope: "sub",
            };
        } else {
            dnSearch = dn;
            filter = { scope: "sub" };
        }

        return await new Promise((resolve, reject) => {
            this.ldapClient.search(dnSearch, filter, (err, res) => {
                if (err) {
                    this.logger.error("ERROR: " + err);
                    reject(
                        new MoleculerClientError(
                            "Cannot recognize user. " + err,
                            404
                        )
                    );
                    return;
                }

                const searchList = [];
                res.on("searchEntry", function (entry) {
                    searchList.push(entry);
                });
                res.on("error", function (err) {
                    reject(new MoleculerServerError(err.message));
                });
                res.on("end", () => {
                    if (searchList.length >= 1) {
                        const users = [];
                        searchList.forEach((item) => {
                            const ldapUser = item.object;
                            const userInfo = {
                                id: ldapUser.uid.replace(/\./g, "-"),
                                userName: ldapUser.uid,
                                firstName: ldapUser.givenName,
                                lastName: ldapUser.sn,
                                fullName: ldapUser.cn,
                                mail: ldapUser.mail,
                                dn: ldapUser.dn,
                                phone: ldapUser.telephoneNumber,
                            };
                            users.push(userInfo);
                        });

                        resolve(users);
                    } else {
                        reject(
                            new MoleculerClientError(
                                "Cannot recognize user",
                                404
                            )
                        );
                    }
                });
            });
        });
    },
};

module.exports = service;

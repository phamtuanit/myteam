const {
    MoleculerClientError,
    ServiceNotAvailableError,
    MoleculerServerError,
} = require("moleculer").Errors;
const ldap = require("ldapjs");
const authConf = require("../conf/auth.json");

const service = function(logger) {
    this.logger = logger || console;
    this.ldapClient = null;
};

service.prototype = {
    close() {
        if (this.ldapClient) {
            this.logger.info("Close LDAP connection.");
            this.ldapClient.destroy();
        }
    },
    confirmLdap() {
        if (!this.ldapClient) {
            try {
                this.ldapClient = ldap.createClient({
                    url: authConf.server,
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
    verify(userName, password) {
        if (!this.confirmLdap()) {
            return Promise.reject(
                new ServiceNotAvailableError("Could not connect to LDAP server")
            );
        }

        return new Promise((resolve, reject) => {
            this.search("", userName).then(users => {
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
    search(dn, userName) {
        if (!this.confirmLdap()) {
            return Promise.reject(
                new ServiceNotAvailableError("Could not connect to LDAP server")
            );
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
                                userName: ldapUser.uid,
                                firstName: ldapUser.givenName,
                                lastNme: ldapUser.sn,
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
                            new MoleculerClientError("Cannot recognize user")
                        );
                    }
                });
            });
        });
    },
};

module.exports = service;

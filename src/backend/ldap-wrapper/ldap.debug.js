const authConf = require("../conf/auth.json");

const service = function (logger) {
    this.logger = logger || console;
};

service.prototype = {
    close() {
        this.logger.info("Close LDAP connection.");
    },
    verify() {
        return Promise.resolve(authConf.debug.users[0]);
    },
};

module.exports = service;

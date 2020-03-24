const authConf = require("../conf/auth.json");

const service = function(logger) {
    this.logger = logger || console;
};

service.prototype = {
    close() {
        this.logger.info("Close LDAP connection.");
    },
    verify() {
        return Promise.resolve(authConf.debug.user);
    },
};

module.exports = service;

const authConf = require("../conf/auth.json");

const service = function (logger) {
    this.logger = logger || console;
};

service.prototype = {
    close() {
        this.logger.info("Close LDAP connection.");
    },
    verify(userName) {
        let found = authConf.debug.users.find(u => u.id === userName);
        if (!found) {
            found = authConf.debug.users[0];
            found.id = userName;
            found.userName = userName;
        }
        return Promise.resolve(found);
    },
};

module.exports = service;

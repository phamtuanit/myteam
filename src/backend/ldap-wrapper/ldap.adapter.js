const authConf = require("../conf/auth.json");

if (authConf.env != "prd") {
    const ldap = require("./ldap.debug.js");
    module.exports = ldap;
} else {
    const ldap = require("./ldap.prd.js");
    module.exports = ldap;
}

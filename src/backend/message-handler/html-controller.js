const Base = require("./handler-base");
module.exports = class HtmlController extends Base {
    constructor(broker, logger) {
        super(broker, logger, "Html");
    }
};

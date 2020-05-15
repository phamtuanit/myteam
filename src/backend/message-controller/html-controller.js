const Base = require("./controller-base");
module.exports = class HtmlController extends Base {
    constructor(broker, logger) {
        super(broker, logger, "Html");
    }
};

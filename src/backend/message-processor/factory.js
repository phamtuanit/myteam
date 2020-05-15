const Html = require("./html/index.js");
module.exports = class ProcessorFactory {
    constructor(logger) {
        this.logger = logger;
        this.processors = {};
        this.registerBuiltInProcessor();
    }

    getProcessor(type) {
        const msgType = type || "html";
        return this.processors[msgType];
    }

    use(msgType, processor) {
        this.processors[msgType] = processor;
    }

    registerBuiltInProcessor() {
        this.use("html", new Html(this.logger));
    }
}

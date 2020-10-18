const Base = require("../processor-base.js");
const Mention = require("../mention/index.js");
module.exports = class HtmlProcessor extends Base {
    constructor(logger) {
        super(logger, "Html");
        this.subProcessors = [new Mention(logger)];
    }

    process(message, operation) {
        message = super.process(message, operation);
        this.subProcessors.forEach((processor) => {
            try {
                const newOne = processor.process(message, operation);
                if (newOne) {
                    message = newOne;
                }
            } catch (error) {
                console.error("Couldn't process message with ", processor.name, error);
            }
        });

        return message;
    }
};

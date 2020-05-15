module.exports = class ProcessorBase {
    constructor(logger, name) {
        this.logger = logger;
        this.name = name;
    }

    process(message) {
        this.logger.debug(
            `[${this.name}]`,
            "Trying to process message with type",
            message.body.type
        );
        return message;
    }
};

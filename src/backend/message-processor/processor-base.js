module.exports = class Processor {
    constructor(logger, name) {
        this.logger = logger;
        this.name = name;
    }

    process(message, operation) {
        this.logger.debug(
            `[${this.name}]`,
            "Trying to process message with type",
            message.body.type,
            ", operation",
            operation
        );

        // Define default key
        message.modification = message.modification || [];
        message.reactions = message.reactions || [];
        return message;
    }
};

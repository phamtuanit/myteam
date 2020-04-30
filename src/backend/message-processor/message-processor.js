"use strict";
import TextProcessor from "./text-processor";

module.exports = (function() {
    const processor = function(logger) {
        this.name = "global";
        this.processors = {};
        this.logger = logger || console;
    };

    processor.prototype = {
        init() {
            // Register default processor
            this.register(new TextProcessor(this.logger));
        },
        terminate() {},
        register(processor, key) {
            if (!processor.handleMessage) {
                throw new TypeError(
                    "The processor doesn't has handleMessage() function"
                );
            }
            const pKey = key || processor.name;
            if (!pKey) {
                throw new Error("Missing processor name");
            }
            this.processors[pKey] = processor;
            this.logger.info("Processor '" + pKey + "' is registered.");
        },
        handleMessage(rawMsg) {
            let message = rawMsg;
            const processors = [];
            this.processors.forEach(async processor => {
                try {
                    processors.push(processor.name);
                    message = await processor.handleMessage(message);
                } catch (error) {
                    this.logger.warn(processor.name + " could not process a message.", message);
                    this.logger.error(error);
                }
            });
            this.logger.debug("Processors:", processors);
            message.processors = processors;
            return Promise.resolve(message);
        }
    };

    return processor;
})();

"use strict";

module.exports = (function() {
    const processor = function(logger) {
        this.name = "text-html";
        this.logger = logger || console;
    };

    processor.prototype = {
        init(logger) {
            this.logger = logger || this.logger;
        },
        terminate() {},
        handleMessage(message) {
            return Promise.resolve(message);
        }
    };

    return processor;
})();

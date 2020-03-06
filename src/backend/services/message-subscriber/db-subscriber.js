"use strict";
const sysConf = require("../../conf/system.json");
const RedisBus = require("ioredis");

module.exports = (function() {
    const publisher = function(name, logger) {
        this.name = name; // conversation id
        this.logger = logger || console;
        this.bus = null;
    };

    publisher.prototype = {
        init() {
            this.bus = new RedisBus(sysConf.redis.uri + sysConf.redis.bus);
            return Promise.resolve();
        },
        terminate() {
            if (this.bus) {
                this.bus.disconnect();
            }
            return Promise.resolve();
        },
        subscribe(conversation) {
            return this.bus.psubscribe(`message.*.${conversation}`).then(() => {
                this.bus.on("pmessage", this.onMessage);
            });
        },
        onMessage(pattern, channel, message) {
            this.logger.debug(`${this.name}:${pattern}:${channel} receiving message:`, message);
        }
    };

    return publisher;
})();

"use strict";
const sysConf = require("../../conf/system.json");
const RedisBus = require("ioredis");

module.exports = (function() {
    const publisher = function(name, broker, logger) {
        this.name = name;
        this.logger = logger || console;
        this.broker = broker || {};
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
        publish(channel, act, message) {
            const event = `${channel}.message.${act}`;
            return this.bus.publish(event, message).then(number => {
                this.broker.broadcastLocal("config.changed", config);
                return number;
            });
        }
    };

    return publisher;
})();

"use strict";
const sysConf = require("../../conf/system.json");
const RedisBus = require("ioredis");

class Publisher {
    constructor(name, logger) {
        this.name = name;
        this.logger = logger || console;
        this.bus = null;
    }

    connect() {
        this.bus = new RedisBus(sysConf.redis.uri);
        return this;
    }

    close() {
        if (this.bus) {
            this.bus.disconnect();
        }
        return this;
    }

    publish(event, message) {
        const str = JSON.stringify(message);
        return this.bus.publish(event, str);
    }
}

module.exports = Publisher;

"use strict";
const sysConf = require("../../conf/system.json");
const RedisBus = require("ioredis");
const EventEmitter = require("events");

class Subscriber extends EventEmitter {
    constructor(name, logger) {
        super();
        this.name = name; // conversation id
        this.logger = logger || console;
        this.ws = null;
        this.session = null;
    }

    connect(pattern = "*.*.*") {
        this.bus = new RedisBus(sysConf.redis.uri);
        return this.bus.psubscribe(pattern).then(session => {
            this.session = session;
            // pattern: [conversation].message.[action]
            this.bus.on("pmessage", (pattern, channel, messageStr) => {
                const message = JSON.parse(messageStr);
                this.emit("message", channel, message);
            });
            return session;
        });
    }

    close() {
        if (this.bus) {
            this.bus.disconnect();
        }
        return this;
    }
}

module.exports = Subscriber;

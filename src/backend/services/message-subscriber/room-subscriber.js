"use strict";
const sysConf = require("../../conf/system.json");
const MsgPublisher = require("../message-publisher/message-publisher");
const RedisBus = require("ioredis");

module.exports = (function() {
    const publisher = function(name, logger) {
        this.name = name; // conversation id
        this.logger = logger || console;
        this.bus = null;
        this.isRoom = true;
        this.rooms = {};
        this.memberPublisher = null;
    };

    publisher.prototype = {
        init() {
            this.bus = new RedisBus(sysConf.redis.uri + sysConf.redis.bus);
            this.memberPublisher = new MsgPublisher("", this.logger);
            // this.bus.publish("message.create.1", {id: 1});
            return Promise.resolve();
        },
        terminate() {
            if (this.bus) {
                this.bus.disconnect();
            }
            return Promise.resolve();
        },
        subscribe() {
            return this.bus.psubscribe("*.message.*").then(() => {
                this.bus.on("pmessage", (pattern, channel, message) => {
                    try {
                        this.onMessage(pattern, channel, message);
                    } catch (error) {
                        this.logger.error(error);
                    }
                });
            });
        },
        onMessage(pattern, channel, message) {
            this.logger.debug(
                `${this.name}:${pattern}:${channel} receiving message:`,
                message
            );
            const eventAct = channel.split('.')[2];
            const conversation = channel.split('.')[0];
            let room = this.rooms[conversation];
            if (!room) {
                // Load member in room from DB
            }

            if (room && room.members && room.members.length > 0) {
                room.members.forEach(member => {
                    this.memberPublisher.publish(member.id, eventAct, message);
                });
            }
        }
    };

    return publisher;
})();

"use strict";
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
    name: "live",
    version: 1,
    settings: {},
    dependencies: [],
    mixins: [],
    actions: {
        getUserStatus: {
            auth: true,
            roles: [1],
            rest: "GET /",
            handler() {
                return Object.values(this.livingUser).map(user => {
                    return {
                        info: user,
                        status: "on"
                    };
                });
            }
        },
        getUserStatusById: {
            auth: true,
            roles: [1],
            rest: "GET /:userId",
            params: {
                userId: "any"
            },
            handler(ctx) {
                const { userId } = ctx.params;

                // Get list of user status
                if (Array.isArray(userId)) {
                    const result = [];
                    userId.forEach(id => {
                        const user = this.livingUser[id];
                        const status = user ? "on" : "off";
                        result.push({
                            info: user,
                            status: status
                        });
                    });
                    return result;
                }

                // Get single user status
                const user = this.livingUser[userId];
                const status = user ? "on" : "off";
                return {
                    info: user,
                    status: status
                };
            }
        }
    },

    /**
     * Events
     */
    events: {
        // [NodeID].user.connected
        "*.user.*.socket.connected"(user) {
            this.logger.info(`User ${user.id} has been connected.`);
            this.livingUser[user.id] = this.livingUser[user.id] || {
                user,
                count: 0
            };
            this.livingUser[user.id].count += 1;

            if (this.livingUser[user.id].count == 1) {
                // Inform to
                const eventName = `${this.broker.nodeID}.user.${user.id}.status.on`;
                this.broker.emit(eventName, {
                    user,
                    status: "on"
                });
            }
        },
        // [NodeID].user.disconnected
        "*.user.*.socket.disconnected"(user) {
            this.logger.info(`User ${user.id} has been disconnected.`);
            if (this.livingUser[user.id]) {
                this.livingUser[user.id].count -= 1;
                if (this.livingUser[user.id].count == 0) {
                    delete this.livingUser[user.id];
                    const eventName = `${this.broker.nodeID}.user.${user.id}.status.off`;
                    this.broker.emit(eventName, {
                        user,
                        status: "off"
                    });
                }
            }
        }
    },

    /**
     * Methods
     */
    methods: {},

    /**
     * Service created lifecycle event handler
     */
    created() {
        this.livingUser = {};
    },

    /**
     * Service started lifecycle event handler
     */
    started() { },

    /**
     * Service stopped lifecycle event handler
     */
    stopped() { }
};

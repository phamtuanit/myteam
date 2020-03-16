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
                        user,
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
                userId: "string"
            },
            handler(ctx) {
                const { userId } = ctx.params;
                const user = this.livingUser[userId];
                const status = user ? "on" : "off";
                return {
                    user: user || { id: userId },
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
        "*.user.connected"(user) {
            this.logger.info(`User ${user.id} has been connected.`);
            this.livingUser[user.id] = user;

            // Inform to 
            const eventName = `${this.nodeID}.user.status`;
            this.broker.emit(eventName, {
                user,
                status: "on"
            });
        },
        // [NodeID].user.disconnected
        "*.user.disconnected"(user) {
            this.logger.info(`User ${user.id} has been disconnected.`);
            delete this.livingUser[user.id];

            const eventName = `${this.nodeID}.user.status`;
            this.broker.emit(eventName, {
                user,
                status: "off"
            });
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
    started() {},

    /**
     * Service stopped lifecycle event handler
     */
    stopped() {}
};

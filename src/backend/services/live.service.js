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
            visibility: "public",
            rest: "GET /:userId",
            params: {
                userId: "string"
            },
            handler(ctx) {
                const { userId } = ctx.params;
                const user = this.livingUser[userId];
                const status = user ? "on" : "off";
                return Promise.resolve({
                    user: user,
                    status: status
                });
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
        },
        // [NodeID].user.disconnected
        "*.user.disconnected"(user) {
            this.logger.info(`User ${user.id} has been disconnected.`);
            delete this.livingUser[user.id];
        },
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

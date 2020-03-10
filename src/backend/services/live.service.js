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
            async handler(ctx) {
                const { userId } = ctx.params;
                return Promise.resolve({
                    userId,
                    status: 'Online'
                });
            }
        }
    },

    /**
     * Events
     */
    events: {},

    /**
     * Methods
     */
    methods: {},

    /**
     * Service created lifecycle event handler
     */
    created() {},

    /**
     * Service started lifecycle event handler
     */
    started() {},

    /**
     * Service stopped lifecycle event handler
     */
    stopped() {}
};

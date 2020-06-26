"use strict";
const Errors = require("moleculer-web").Errors;
const authConf = require("../conf/auth.json");

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
    name: "authorization",
    version: 1,
    settings: {},
    dependencies: ["v1.auth"],
    mixins: [],
    actions: {
        canAccess: {
            visibility: "public",
            params: {
                target: "object",
            },
            async handler(ctx) {
                const { target: action } = ctx.params;
                // -1: Allow all traffics
                if (
                    action.roles &&
                    Array.isArray(action.roles) &&
                    !action.roles.includes(-1)
                ) {
                    const user = ctx.meta.user;
                    const userEntity = await ctx.call("v1.users.getUserById", {
                        id: user.id,
                    });
                    // Check the user role
                    if (
                        !userEntity ||
                        userEntity.role == null ||
                        typeof userEntity.role !== "number" ||
                        !action.roles.includes(userEntity.role)
                    ) {
                        throw new Errors.ForbiddenError(
                            "You don't have access right",
                            { user: user.id }
                        );
                    }
                }
            },
        },
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
    stopped() {},
};

"use strict";
const Errors = require("moleculer").Errors;
const HandlerFactory = require("../message-handler/factory.js");

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
    name: "extensions.messages",
    version: 1,
    settings: {},
    dependencies: ["v1.messages", "v1.conversations"],
    mixins: [],
    actions: {
        postMessages: {
            auth: true,
            roles: [15],
            rest: "POST /",
            params: {
                conversation_id: { type: "number", optional: true, convert: true },
                user_id: { type: "string", optional: true },
                body: {
                    type: "object",
                    props: {
                        content: { type: "string" },
                        type: { type: "string", optional: true, default: "html" },
                    },
                },
            },
            async handler(ctx) {
                let { conversation_id: conversationId, user_id: userId } = ctx.params;
                if (!conversationId && !userId) {
                    this.logger.warn("Could not process message due to missing metadata.");
                    throw new Errors.ValidationError("Missing destination.");
                }

                if (!conversationId) {
                    let convInfo = await this.findConvByUserId(userId, ctx);
                    if (!convInfo) {
                        const userInfo = await ctx.call("v1.users.getUserById", { id: userId, });
                        if (!userInfo) {
                            throw new Errors.ValidationError("The user could not be found.", 404);
                        }
                        convInfo = await this.createConvForUser(userId, ctx);
                    }
                    conversationId = convInfo.id;
                }

                return await ctx.call("v1.messages.postMessage", { conversation: conversationId, body: ctx.params.body });
            },
        },
    },

    /**
     * Events
     */
    events: { },

    /**
     * Methods
     */
    methods: {
        async findConvByUserId(userId, ctx) {
            const convList = await ctx.call("v1.conversations.getSimpleConversationByUserId", { id: userId }).catch(this.logger.error);
            return convList[0];
        },
        async createConvForUser(userId, ctx) {
            const request = {
                channel: {
                    name: "",
                    subscribers: [userId, String(ctx.meta.user.id)],
                    applications: [String(ctx.meta.user.id)],
                    channel: false,
                },
            };
            const convInfo = await ctx.call("v1.conversations.createConversation", request).catch(this.logger.error);
            if (convInfo) {
                this.logger.info(`Conversation ${convInfo.id} is created successfully.`, convInfo.subscribers);
                return convInfo;
            }
        }
    },

    /**
     * Service created lifecycle event handler
     */
    created() {},

    /**
     * Service started lifecycle event handler
     */
    started() { },

    /**
     * Service stopped lifecycle event handler
     */
    stopped() {},
};

"use strict";
const Errors = require("moleculer").Errors;
const DBCollectionService = require("../mixins/collection.db.mixin");
const { cleanDbMark } = require("../utils/entity");
const HandlerFactory = require("../message-handler/factory.js");

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
    name: "messages",
    version: 1,
    settings: {},
    dependencies: ["v1.auth", "v1.conversations"],
    mixins: [DBCollectionService],

    /**
     * Events
     */
    events: {
        async "conversation.*.removed"(payload, sender, event, ctx) {
            const [, convId, act] = event.split(".");
            const convCollId = this.getHistoryCollectionName(convId);

            if (act == "removed") {
                const dbCollection = await this.getDBCollection(convCollId);
                const collection = dbCollection.collection;
                const count = await collection.countDocuments();
                if (count > 0) {
                    this.logger.info("[DB] Deleting DB collection", convCollId);
                    return await collection.drop();
                }
            }
        },
    },

    actions: {
        getMessages: {
            auth: true,
            roles: [-1],
            rest: "GET /",
            params: {
                conversation: { type: "number", convert: true },
                limit: { type: "number", optional: true, convert: true },
                rightId: { type: "number", optional: true, convert: true },
                leftId: { type: "number", optional: true, convert: true },
                offset: { type: "number", optional: true, convert: true },
                top: { type: "number", optional: true, convert: true },
                sort: { type: "array", optional: true },
                history: { type: "boolean", optional: true, convert: true },
            },
            async handler(ctx) {
                const { conversation: conversationId } = ctx.params;
                const controller = this.controllerFactory.getController("html");
                return await controller
                    .setConversation(conversationId)
                    .setContext(ctx)
                    .get()
                    .commit();
            },
        },
        getMessagesById: {
            auth: true,
            roles: [-1],
            rest: "GET /:id",
            params: {
                conversation: { type: "number", convert: true },
                id: { type: "number", optional: true, convert: true },
                history: { type: "boolean", optional: true, convert: true },
            },
            async handler(ctx) {
                const { conversation: conversationId } = ctx.params;
                const controller = this.controllerFactory.getController("html");
                return await controller
                    .setConversation(conversationId)
                    .setContext(ctx)
                    .get()
                    .commit();
            },
        },
        getPinnedMessage: {
            auth: true,
            roles: [-1],
            rest: "GET /pins",
            params: {
                conversation: { type: "number", convert: true },
                user: { type: "string", optional: true },
            },
            async handler(ctx) {
                const {
                    conversation: conversationId,
                    user: userId,
                } = ctx.params;
                const controller = this.controllerFactory.getController("html");

                return await controller
                    .setConversation(conversationId)
                    .setContext(ctx)
                    .getPinned({ userId })
                    .commit();
            },
        },
        postMessage: {
            auth: true,
            roles: [-1],
            rest: "POST /",
            params: {
                conversation: { type: "number", convert: true },
                body: {
                    type: "object",
                    props: {
                        type: { type: "string" },
                        content: [{ type: "string" }, { type: "object" }],
                    },
                },
            },
            async handler(ctx) {
                const { conversation, body } = ctx.params;
                const { user } = ctx.meta;

                const controller = this.controllerFactory.getController(
                    body.type
                );
                return await controller
                    .setConversation(conversation)
                    .setContext(ctx)
                    .add({ body })
                    .commit()
                    .then(cleanDbMark);
            },
        },
        updateMessage: {
            auth: true,
            roles: [-1],
            rest: "PUT /:id",
            params: {
                conversation: { type: "number", convert: true },
                id: { type: "number", convert: true },
                body: {
                    type: "object",
                    props: {
                        type: { type: "string" },
                        content: [{ type: "string" }, { type: "object" }],
                    },
                },
            },
            async handler(ctx) {
                const { conversation, body, id } = ctx.params;

                const message = {
                    updated: new Date(),
                    id: id,
                    body,
                };

                const controller = this.controllerFactory.getController(
                    message.body.type
                );
                return await controller
                    .setConversation(conversation)
                    .setContext(ctx)
                    .update(message)
                    .commit()
                    .then(cleanDbMark);
            },
        },
        removeMessage: {
            auth: true,
            roles: [-1],
            rest: "DELETE /:id",
            params: {
                conversation: { type: "number", convert: true },
                id: { type: "number", convert: true },
            },
            async handler(ctx) {
                const { conversation: conversationId, id } = ctx.params;
                const controller = this.controllerFactory.getController("html");
                return await controller
                    .setConversation(conversationId)
                    .setContext(ctx)
                    .delete({ id })
                    .commit()
                    .then(cleanDbMark);
            },
        },
        reactionMessage: {
            auth: true,
            roles: [-1],
            rest: "PUT /:id/reactions/:type",
            params: {
                conversation: { type: "number", convert: true },
                id: { type: "number", convert: true },
                type: "string",
                status: { type: "boolean", convert: true, default: true },
            },
            async handler(ctx) {
                const {
                    conversation: conversationId,
                    id,
                    type,
                    status,
                } = ctx.params;
                const controller = this.controllerFactory.getController("html");
                return await controller
                    .setConversation(conversationId)
                    .setContext(ctx)
                    .react({ id, type, operation: status })
                    .commit()
                    .then(cleanDbMark);
            },
        },
        pinMessage: {
            auth: true,
            roles: [-1],
            rest: "PUT /:id/pins",
            params: {
                conversation: { type: "number", convert: true },
                id: { type: "number", convert: true },
                status: { type: "boolean", convert: true, default: true },
            },
            async handler(ctx) {
                const {
                    conversation: conversationId,
                    id: msgId,
                    status,
                } = ctx.params;
                const controller = this.controllerFactory.getController("html");
                return await controller
                    .setConversation(conversationId)
                    .setContext(ctx)
                    .pin({ id: msgId, operation: status })
                    .commit()
                    .then(cleanDbMark);
            },
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
        this.controllerFactory = new HandlerFactory(this.broker, this.logger);
    },

    /**
     * Service started lifecycle event handler
     */
    started() {},

    /**
     * Service stopped lifecycle event handler
     */
    stopped() {
        this.controllerFactory.clean();
    },
};

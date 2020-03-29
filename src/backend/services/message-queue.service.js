"use strict";
const Errors = require("moleculer").Errors;
const DBCollectionService = require("../mixins/collection.db.mixin");
const { cleanDbMark } = require("../utils/entity");

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
    name: "messages-queue",
    version: 1,
    settings: {},
    dependencies: [],
    mixins: [DBCollectionService],

    /**
     * Events
     */
    events: {
        // message-queue.[userId].message.confirmed
        async "message-queue.*.message.confirmed"(payload, sender, event, ctx) {
            const [constVar, userId] = event.split(".");

            const queueId = `msg-queue-${userId}`;
            const dbCollection = await this.getDBCollection(queueId);

            const msg = await dbCollection.findOne({ id: payload.id });

            if (msg) {
                return await dbCollection.removeById(msg._id).then(cleanDbMark);
            }
        },
    },

    actions: {
        cleanQueue: {
            auth: true,
            roles: [1],
            rest: "DELETE /:userId/messages/:id",
            params: {
                userId: "string",
                id: { type: "number", convert: true },
                cmp: { type: "string", optional: true, convert: true, default: "lte" },
            },
            async handler(ctx) {
                const { userId, id: lastMessageId } = ctx.params;
                const cmp = "$" + ctx.params.cmp;

                const queueId = `msg-queue-${userId}`;
                const dbCollection = await this.getDBCollection(queueId);

                const filter = { id: {} };
                filter.id[cmp] = lastMessageId || new Date().getTime();
                return await dbCollection.removeMany(filter);
            },
        },
        pullMessage: {
            auth: true,
            roles: [1],
            rest: "GET /:userId/messages/:id",
            params: {
                userId: "string",
                id: { type: "number", convert: true },
            },
            async handler(ctx) {
                const { userId, id } = ctx.params;

                const queueId = `msg-queue-${userId}`;
                const dbCollection = await this.getDBCollection(queueId);

                const filter = { id: id };
                return await dbCollection.findOne(filter).then(cleanDbMark);
            },
        },
        pullQueue: {
            auth: true,
            roles: [1],
            rest: "GET /:userId/messages",
            params: {
                userId: "string",
            },
            async handler(ctx) {
                const { userId } = ctx.params;

                const queueId = `msg-queue-${userId}`;
                const dbCollection = await this.getDBCollection(queueId);
                return await dbCollection.find({}).then(cleanDbMark);
            },
        },
        pushToQueue: {
            auth: true,
            roles: [1],
            rest: "POST /:userId/messages",
            params: {
                userId: "string",
                message: {
                    type: "object",
                    props: {
                        id: { type: "number", optional: true, convert: true },
                        type: "string",
                        action: "string",
                        payload: {
                            type: "object",
                            props: {
                                id: { type: "number", convert: true },
                            },
                        }
                    },
                },
            },
            async handler(ctx) {
                const { userId, message } = ctx.params;

                const queueId = `msg-queue-${userId}`;
                const dbCollection = await this.getDBCollection(queueId);
                const res = await dbCollection.insert(message).then(cleanDbMark);

                // Emit event to live user
                const eventName = `message-queue.${userId}.message.${message.action}`;
                this.broker
                    .emit(eventName, cleanDbMark(message))
                    .catch(this.logger.error);

                return res;
            },
        },
    },

    /**
     * Methods
     */
    methods: {
    },

    /**
     * Service created lifecycle event handler
     */
    created() { },

    /**
     * Service started lifecycle event handler
     */
    started() { },

    /**
     * Service stopped lifecycle event handler
     */
    stopped() { },
};

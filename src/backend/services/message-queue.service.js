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
    dependencies: ["v1.auth", "v1.messages", "v1.conversations"],
    mixins: [DBCollectionService],

    /**
     * Events
     */
    events: {
        // message-queue.[userId].message.confirmed
        async "message-queue.*.message.confirmed"(payload, sender, event) {
            const [, userId] = event.split(".");

            try {
                const queueId = `msg-queue-${userId}`;
                const dbCollection = await this.getDBCollection(queueId);

                const filter = {
                    id: {
                        $lte: payload.id
                    }
                };
                return await dbCollection.removeMany(filter);
            } catch (error) {
                this.logger.error("Could not remove message.", error);
                throw error;
            }
        },
    },

    actions: {
        confirmMessage: {
            auth: true,
            roles: [-1],
            rest: "PUT /:userId/messages",
            params: {
                userId: "string",
                id: { type: "string", optional: true },
                payloadId: { type: "string", optional: true }
            },
            async handler(ctx) {
                const { userId, id } = ctx.params;
                const payloadId = ctx.params["payload-id"] || ctx.params.payloadId;

                this.verifyUser(ctx, userId);

                const filter = {};

                if (id) {
                    let ids = id.split(",");
                    ids = ids.map(s => new Number(s).valueOf());
                    filter.id = {
                        $in: ids,
                    };
                }

                if (payloadId) {
                    let payloadIds = payloadId.split(",");
                    payloadIds = payloadIds.map(s => new Number(s).valueOf());
                    filter["payload.id"] = {
                        $in: payloadIds,
                    };
                }

                if (!id && !payloadId) {
                    throw new Errors.MoleculerClientError("id or payload id is required.", 400);
                }

                try {
                    const queueId = `msg-queue-${userId}`;
                    const dbCollection = await this.getDBCollection(queueId);
                    return await dbCollection.removeMany(filter);
                } catch (error) {
                    this.logger.error("Could not remove message in queue.", error);
                    throw error;
                }
            },
        },
        pullMessageById: {
            auth: true,
            roles: [-1],
            rest: "GET /:userId/messages/:id",
            params: {
                userId: "string",
                id: { type: "number", convert: true },
            },
            async handler(ctx) {
                const { userId, id } = ctx.params;

                this.verifyUser(ctx, userId);

                const queueId = `msg-queue-${userId}`;
                const dbCollection = await this.getDBCollection(queueId);

                const filter = { id: id };
                return await dbCollection.findOne(filter).then(cleanDbMark);
            },
        },
        pullMessages: {
            auth: true,
            roles: [-1],
            rest: "GET /:userId/messages",
            params: {
                userId: "string",
            },
            async handler(ctx) {
                const { userId } = ctx.params;

                this.verifyUser(ctx, userId);

                const queueId = `msg-queue-${userId}`;
                const dbCollection = await this.getDBCollection(queueId);
                return await dbCollection.find({}).then(cleanDbMark);
            },
        },
        pushMessageToQueue: {
            auth: true,
            roles: [-1],
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

                try {
                    const queueId = `msg-queue-${userId}`;
                    const dbCollection = await this.getDBCollection(queueId);
                    const res = await dbCollection.insert(cleanDbMark(message)).then(cleanDbMark);

                    // Emit event to live user
                    const eventName = `message-queue.${userId}.message.${message.action}`;
                    this.broker
                        .broadcast(eventName, cleanDbMark(message))
                        .then(() => {
                            this.logger.info("Published message to user-queue.", queueId, message.id);
                        })
                        .catch(this.logger.error);

                    return res;
                } catch (error) {
                    this.logger.error("Could not store message to queue.", error);
                    throw error;
                }
            },
        },
    },

    /**
     * Methods
     */
    methods: {
        verifyUser(ctx, userId) {
            const { user } = ctx.meta;
            if (user.id != userId) {
                throw new Errors.MoleculerClientError("It is not your queue.", 401);
            }
        }
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

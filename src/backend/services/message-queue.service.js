"use strict";
const Errors = require("moleculer").Errors;
const DBCollectionService = require("../mixins/collection.db.mixin");
const { cleanDbMark } = require("../utils/entity");

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
    name: "user-queue",
    version: 1,
    settings: {},
    dependencies: ["v1.auth", "v1.authorization"],
    mixins: [DBCollectionService],

    /**
     * Events
     */
    events: {},

    actions: {
        confirmMessage: {
            auth: true,
            roles: [-1],
            rest: "PUT /:userId/messages",
            params: {
                userId: "string",
                ids: { type: "string", optional: true },
            },
            async handler(ctx) {
                const { userId } = ctx.params;
                let { ids } = ctx.params;

                this.verifyUser(ctx, userId);

                const filter = {};

                if (ids) {
                    ids = ids.split(",");
                    ids = ids.map((s) => new Number(s).valueOf());
                    filter["payload.id"] = {
                        $in: ids,
                    };
                }

                if (!ids) {
                    throw new Errors.MoleculerClientError(
                        "Ids or payload id is required.",
                        400
                    );
                }

                try {
                    const queueId = `msg-queue-${userId}`;
                    const dbCollection = await this.getDBCollection(queueId);
                    const res = await dbCollection.removeMany(filter);

                    // Emit event to live user
                    // const eventName = `user-queue.confirmed`;
                    // this.broker.broadcast(eventName, {ids, ids: ids}).catch(this.logger.error);

                    return res;
                } catch (error) {
                    this.logger.error(
                        "Could not remove message in queue.",
                        error
                    );
                    throw error;
                }
            },
        },
        cleanQueue: {
            visibility: "public",
            roles: [-1],
            params: {
                userId: "string",
                lastId: "number"
            },
            async handler(ctx) {
                const { userId, lastId } = ctx.params;
                try {
                    const queueId = `msg-queue-${userId}`;
                    const dbCollection = await this.getDBCollection(queueId);

                    const filter = {
                        id: {
                            $lte: lastId,
                        },
                    };

                    const res = await dbCollection.removeMany(filter);

                    // Emit event to live user
                    // const eventName = `user-queue.confirmed`;
                    // this.broker.broadcast(eventName, { userId, lastId: lastId }).catch(this.logger.error);

                    return res;
                } catch (error) {
                    this.logger.error("Could not clean message-queue.", userId, error);
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
                        },
                    },
                },
            },
            async handler(ctx) {
                const { userId, message } = ctx.params;
                const msgEntity = cleanDbMark({ ...message });

                try {
                    const queueId = `msg-queue-${userId}`;
                    const dbCollection = await this.getDBCollection(queueId);
                    const res = await dbCollection.insert(msgEntity);

                    // Emit event to live user
                    const eventName = `user-queue.${msgEntity.action}`;
                    this.broker.broadcast(eventName, {userId, payload: msgEntity}).catch(this.logger.error);
                    return res;
                } catch (error) {
                    this.logger.error(
                        "Could not store message to queue.",
                        msgEntity.id,
                        error
                    );
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
                throw new Errors.MoleculerClientError(
                    "It is not your queue.",
                    401
                );
            }
        },
    },

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

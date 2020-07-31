"use strict";
const DBCollectionService = require("../mixins/collection.db.mixin");
const { cleanDbMark } = require("../utils/entity");
const Errors = require("moleculer").Errors;

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
    name: "conversations",
    version: 1,
    settings: {},
    dependencies: ["v1.auth", "v1.authorization", "v1.user-queue"],
    mixins: [DBCollectionService],

    events: {
        async "conversation.*.updated|removed|created"() {
            // Clear all cache entries which keys start with `users.`
            this.broker.cacher.clean("*.conversations.*");
        },
    },

    actions: {
        createConversation: {
            auth: true,
            roles: [0, 5],
            rest: "POST /",
            params: {
                channel: {
                    type: "object",
                    props: {
                        name: { type: "string", optional: true },
                        subscribers: { type: "array", empty: false },
                        channel: {
                            type: "boolean",
                            optional: true,
                            convert: true,
                            default: true,
                        },
                    },
                },
            },
            async handler(ctx) {
                // 1. Create conversation information
                const convInfo = await this.createConversation(ctx).then(cleanDbMark);

                // Inform all subscribers
                const msgQueue = {
                    id: new Date().getTime(),
                    type: "conversation",
                    action: "created",
                    payload: convInfo,
                };

                if (convInfo.subscribers && convInfo.subscribers.length > 0) {
                    // 2. Save information to user queue and send message to WS
                    for (
                        let index = 0;
                        index < convInfo.subscribers.length;
                        index++
                    ) {
                        const subscriberId = convInfo.subscribers[index];

                        // 2.1 Save new information to DB of corresponding user cache
                        ctx.call("v1.user-queue.pushMessageToQueue", {
                            userId: subscriberId,
                            message: msgQueue,
                        }).catch((error) => {
                            this.logger.warn(
                                "Could not save message to queue.",
                                msgQueue,
                                error
                            );
                        });
                    }
                }

                // Broadcast message
                const eventName = `conversation.${convInfo.id}.created`;
                this.broker
                    .broadcast(eventName, convInfo)
                    .catch(this.logger.error);
                return convInfo;
            },
        },
        getConversationById: {
            auth: true,
            roles: [-1],
            rest: "GET /:id",
            cache: true,
            params: {
                id: { type: "number", convert: true },
            },
            async handler(ctx) {
                const { id } = ctx.params;
                const { user: me } = ctx.meta;
                return await this.getDBCollection("conversations").then(
                    (collection) => {
                        return collection
                            .findOne({ id })
                            .then((convInfo) => {
                                if (
                                    convInfo &&
                                    !convInfo.subscribers.includes(me.id)
                                ) {
                                    throw new Errors.MoleculerClientError(
                                        "You are not member of that conversation.",
                                        404
                                    );
                                }

                                return convInfo;
                            })
                            .then(cleanDbMark);
                    }
                );
            },
        },
        getConversation: {
            auth: true,
            roles: [-1],
            cache: true,
            rest: "GET /",
            params: {
                limit: { type: "number", optional: true, convert: true },
                offset: { type: "number", optional: true, convert: true },
                sort: { type: "string", optional: true },
                user: { type: "string", optional: true },
                channel: {
                    type: "boolean",
                    optional: true,
                    convert: true,
                },
            },
            handler(ctx) {
                const { sort, channel } = ctx.params;
                let { user } = ctx.params;
                const { user: me } = ctx.meta;
                let { limit, offset } = ctx.params;
                limit = limit != undefined ? limit : 50;
                offset = offset != undefined ? offset : 0;

                // Get list of message
                const filter = {
                    limit,
                    offset,
                    sort: sort || ["-id"],
                    query: {},
                };

                if (typeof channel == "boolean") {
                    filter.query.channel = channel;
                }

                if (user) {
                    if (user !== me.id) {
                        throw new Errors.MoleculerClientError(
                            "You don't have permission to do this request.",
                            404
                        );
                    }

                    user = [user];
                } else {
                    // Update user
                    user = [me.id];
                }

                filter.query.subscribers = {
                    $in: user,
                };

                return this.getDBCollection("conversations").then(
                    (collection) => {
                        return collection.find(filter).then((records) => {
                            return records.map(cleanDbMark);
                        });
                    }
                );
            },
        },
        updateConversation: {
            auth: true,
            roles: [-1],
            rest: "PUT /:id",
            params: {
                id: { type: "number", convert: true },
                channel: {
                    type: "object",
                    props: {
                        name: { type: "string", optional: true },
                        subscribers: { type: "array", empty: false },
                        channel: {
                            type: "boolean",
                            optional: true,
                            convert: true,
                        },
                    },
                },
            },
            async handler(ctx) {
                const { channel, id: convId } = ctx.params;
                // Get adapter
                const dbCollection = await this.getDBCollection(
                    "conversations"
                );

                const existingConv = await dbCollection.findOne({
                    id: convId || channel.id,
                });

                if (!existingConv) {
                    // The conversation not found
                    this.logger.warn(
                        "The conversation could not be found.",
                        channel.id
                    );
                    throw new Errors.MoleculerError(
                        "The conversation could not be found.",
                        404
                    );
                }

                this.checkCreatorRole(ctx, existingConv);
                channel.updated = new Date();

                const updatedEntity = await dbCollection
                    .updateById(existingConv._id, { $set: channel })
                    .then(cleanDbMark);

                const subscribers = new Set(
                    existingConv.subscribers.concat(updatedEntity.subscribers)
                );

                if (subscribers.size > 0) {
                    const msgQueue = {
                        id: new Date(channel.updated).getTime(),
                        type: "conversation",
                        action: "updated",
                        payload: updatedEntity,
                    };

                    // 2. Save information to user queue and send message to WS
                    subscribers.forEach((subscriberId) => {
                        // 2.1 Save new information to DB of corresponding user cache
                        ctx.call("v1.user-queue.pushMessageToQueue", {
                            userId: subscriberId,
                            message: msgQueue,
                        }).catch((error) => {
                            this.logger.warn(
                                "Could not save message to queue.",
                                msgQueue,
                                error
                            );
                        });
                    });
                }

                // Broadcast message
                const eventName = `conversation.${updatedEntity.id}.updated`;
                this.broker
                    .broadcast(eventName, updatedEntity)
                    .catch(this.logger.error);
                return updatedEntity;
            },
        },
        leaveConversation: {
            auth: true,
            roles: [-1],
            rest: "PUT /:id/leave",
            params: {
                id: { type: "number", convert: true },
                user: "string",
            },
            async handler(ctx) {
                const { user: userId, id: convId } = ctx.params;
                // Get adapter
                const dbCollection = await this.getDBCollection(
                    "conversations"
                );

                const existingConv = await dbCollection.findOne({
                    id: convId,
                });

                if (!existingConv) {
                    // The conversation not found
                    this.logger.warn(
                        "The conversation could not be found.",
                        convId
                    );
                    return;
                }

                // Remove subscriber
                const newEntity = await dbCollection.updateById(
                    existingConv._id,
                    {
                        $pull: {
                            subscribers: userId,
                        },
                    }
                );

                cleanDbMark(existingConv);

                const subscribers = new Set(
                    existingConv.subscribers.concat(newEntity.subscribers)
                );
                if (subscribers.size > 0) {
                    // Inform all subscribers
                    const msgQueue = {
                        id: new Date().getTime(),
                        type: "conversation",
                        action: "left",
                        payload: newEntity,
                    };

                    // 2. Save information to user queue and send message to WS
                    subscribers.forEach((subscriberId) => {
                        // 2.1 Save new information to DB of corresponding user cache
                        ctx.call("v1.user-queue.pushMessageToQueue", {
                            userId: subscriberId,
                            message: msgQueue,
                        }).catch((error) => {
                            this.logger.warn(
                                "Could not save message to queue.",
                                msgQueue,
                                error
                            );
                        });
                    });
                }

                // Broadcast message
                const eventName = `conversation.${existingConv.id}.updated`;
                this.broker
                    .broadcast(eventName, existingConv)
                    .catch(this.logger.error);
                return existingConv;
            },
        },
        deleteConversation: {
            auth: true,
            roles: [-1],
            rest: "DELETE /:id",
            params: {
                id: { type: "number", convert: true },
            },
            async handler(ctx) {
                const { id: convId } = ctx.params;
                // Get adapter
                const dbCollection = await this.getDBCollection(
                    "conversations"
                );

                // Verify conversation
                const existingConv = await dbCollection.findOne({ id: convId });
                if (!existingConv) {
                    // The conversation not found
                    this.logger.warn(
                        "The conversation could not be found.",
                        convId
                    );
                    throw new Errors.MoleculerError(
                        "The conversation could not be found.",
                        404
                    );
                }

                // Delete tracking information
                existingConv.deleted = new Date();
                await dbCollection.removeById(existingConv._id);
                cleanDbMark(existingConv);

                // Inform all subscribers
                const msgQueue = {
                    id: new Date().getTime(),
                    type: "conversation",
                    action: "removed",
                    payload: existingConv,
                };
                if (
                    existingConv.subscribers &&
                    existingConv.subscribers.length > 0
                ) {
                    // 2. Save information to user queue and send message to WS
                    for (
                        let index = 0;
                        index < existingConv.subscribers.length;
                        index++
                    ) {
                        const subscriberId = existingConv.subscribers[index];

                        // 2.1 Save new information to DB of corresponding user cache
                        ctx.call("v1.user-queue.pushMessageToQueue", {
                            userId: subscriberId,
                            message: msgQueue,
                        }).catch((error) => {
                            this.logger.warn(
                                "Could not save message to queue.",
                                msgQueue,
                                error
                            );
                        });
                    }
                }

                // Broadcast message
                const eventName = `conversation.${existingConv.id}.removed`;
                this.broker
                    .broadcast(eventName, existingConv)
                    .catch(this.logger.error);
                return existingConv;
            },
        },
    },

    /**
     * Methods
     */
    methods: {
        checkCreatorRole(ctx, conv) {
            const { user } = ctx.meta;
            if (user.id !== conv.creator) {
                this.logger.warn(
                    `${user.id} are not admin of this channel ${conv.id}.`
                );
                throw new Errors.MoleculerError(
                    "You are not admin of this channel.",
                    401
                );
            }
        },
        async createConversation(ctx) {
            const { user } = ctx.meta;
            const { channel } = ctx.params;

            const convInfo = channel;
            convInfo.id = new Date().getTime();
            convInfo.creator = user.id;
            convInfo.created = new Date();

            // Get adapter
            const dbCollection = await this.getDBCollection("conversations");
            const convEntity = await dbCollection.insert(convInfo);
            this.logger.info("Added new conversation.", convEntity.id);
            return convEntity;
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

"use strict";
const Errors = require("moleculer").Errors;
const DBCollectionService = require("../mixins/collection.db.mixin");
const { cleanDbMark } = require("../utils/entity");

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
    name: "messages",
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
                return await dbCollection.removeById(msg._id);
            }
        },
    },

    actions: {
        getMessages: {
            auth: true,
            roles: [1],
            rest: "GET /",
            params: {
                conversation: { type: "number", convert: true },
                limit: { type: "number", optional: true, convert: true },
                offset: { type: "number", optional: true, convert: true },
                sort: { type: "array", optional: true },
                history: { type: "boolean", optional: true, convert: true },
            },
            async handler(ctx) {
                return this.filterMessage(ctx);
            },
        },
        getMessagesById: {
            auth: true,
            roles: [1],
            rest: "GET /:id",
            params: {
                conversation: { type: "number", convert: true },
                id: { type: "number", optional: true, convert: true },
                limit: { type: "number", optional: true, convert: true },
                offset: { type: "number", optional: true, convert: true },
                sort: { type: "array", optional: true, convert: true },
                history: { type: "boolean", optional: true, convert: true },
            },
            handler(ctx) {
                return this.filterMessage(ctx);
            },
        },
        postMessage: {
            auth: true,
            roles: [1],
            rest: "POST /",
            params: {
                conversation: { type: "number", convert: true },
                body: {
                    type: "object",
                    props: {
                        type: { type: "string" },
                    },
                },
            },
            async handler(ctx) {
                const { conversation, body, to } = ctx.params;
                const { user } = ctx.meta;

                const message = {
                    arrivalTime: new Date(),
                    id: new Date().getTime(),
                    body,
                    from: {
                        issuer: user.id,
                        edited: false,
                    },
                    to: {
                        conversation,
                    },
                };

                let convInfo = await ctx.call("v1.conversations.getConversationById", {
                    id: conversation,
                });

                if (!convInfo) {
                    throw new Errors.MoleculerClientError(
                        "The conversation could not be found.",
                        404
                    );
                }

                // if (!convInfo) {
                //     if (!to || typeof to.user != "string") {
                //         const error = "'to.user' is required incase you want to create new conversation.";
                //         this.logger.warn(error, to);
                //         throw new Errors.MoleculerClientError(error)
                //     }

                //     const conv = {
                //         subscribers: [user.id, to.user],
                //         channel: false
                //     }
                //     convInfo = await ctx.call("v1.conversations.createConversation", conv);
                // }

                const newMessage = this.processMessage(message, true);
                return await this.storeMessage(newMessage, ctx, convInfo);
            },
        },
        updateMessage: {
            auth: true,
            roles: [1],
            rest: "PUT /:id",
            params: {
                conversation: { type: "number", convert: true },
                id: { type: "number", convert: true },
                body: {
                    type: "object",
                    props: {
                        type: { type: "string" },
                        content: "object",
                    },
                },
            },
            async handler(ctx) {
                const { conversation, body, id } = ctx.params;
                const { user } = ctx.meta;

                const message = {
                    updated: new Date(),
                    id: id,
                    from: {
                        issuer: user.id,
                        edited: true,
                    },
                    to: {
                        conversation: conversation,
                    },
                    body,
                };

                const newMessage = this.processMessage(message, false);
                return await this.updateMessage(newMessage, ctx);
            },
        },
        removeMessage: {
            auth: true,
            roles: [1],
            rest: "DELETE /:id",
            params: {
                conversation: { type: "number", convert: true },
                id: { type: "number", convert: true },
            },
            async handler(ctx) {
                const { conversation: conversationId, id } = ctx.params;

                // Check conversation
                let convInfo = await ctx.call(
                    "v1.conversations.getConversationById",
                    {
                        id: conversationId,
                    }
                );

                if (!convInfo) {
                    throw new Errors.MoleculerClientError(
                        "The conversation could not be found.",
                        404
                    );
                }

                const convCollId = this.getHistoryCollectionName(
                    conversationId
                );

                // Get adapter
                const dbCollection = await this.getDBCollection(convCollId);
                const message = await dbCollection.findOne({ id });

                // 1. Verify existing message
                if (!message) {
                    // The message not found
                    this.logger.warn("The message could not be found.");
                    return;
                }

                // 2. Delete record
                message.deleted = new Date();
                await dbCollection.removeById(message._id);

                // 3. Store information to message queue
                if (convInfo.subscribers && convInfo.subscribers.length > 0) {
                    const msgQueue = {
                        id: new Date().getTime(),
                        type: "message",
                        action: "removed",
                        payload: message,
                    };

                    for (
                        let index = 0;
                        index < convInfo.subscribers.length;
                        index++
                    ) {
                        const userId = convInfo.subscribers[index];
                        if (userId == message.from.issuer) {
                            // Ignore issuer from subscribers
                            continue;
                        }

                        // Store information to message queue
                        const queueId = `msg-queue-${userId}`;
                        this.getDBCollection(queueId)
                            .then(collection => {
                                collection
                                    .insert(cleanDbMark(msgQueue))
                                    .catch(this.logger.error);
                            })
                            .catch(this.logger.error);

                        // Emit event to live user
                        const eventName = `message-queue.${userId}.message.removed`;
                        this.broker
                            .emit(eventName, cleanDbMark(msgQueue))
                            .catch(this.logger.error);
                    }
                }

                // Clean _id
                cleanDbMark(message);

                // Broadcast message
                const eventName = `conversation.${conversationId}.message.removed`;
                this.broker.emit(eventName, message);

                return message;
            },
        },
        reactionMessage: {
            auth: true,
            roles: [1],
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
                const { user } = ctx.meta;

                // Check conversation
                let convInfo = await ctx.call(
                    "v1.conversations.getConversationById",
                    {
                        id: conversationId,
                    }
                );

                if (!convInfo) {
                    throw new Errors.MoleculerClientError(
                        "The conversation could not be found.",
                        404
                    );
                }

                const convCollId = this.getHistoryCollectionName(
                    conversationId
                );

                // Get adapter
                const dbCollection = await this.getDBCollection(convCollId);
                const message = await dbCollection.findOne({ id });

                // 1. Verify existing message
                if (!message) {
                    // The message not found
                    this.logger.warn("The message could not be found.");
                    throw new Errors.MoleculerClientError(
                        "The message could not be found",
                        404
                    );
                }

                let result = null;
                const reactionInfo = {
                    user: user.id,
                    type,
                };

                if (!message.reactions) {
                    // Incase reactions is null
                    if (status == true) {
                        const update = {
                            $set: {
                                reactions: [reactionInfo],
                            },
                        };
                        result = await dbCollection.updateById(
                            message._id,
                            update
                        );
                    }
                    return null;
                } else {
                    const lastReaction = message.reactions.find(
                        i => i.user == user.id
                    );

                    if (status == true) {
                        if (lastReaction) {
                            // Incase user was reacted -> change type only
                            const update = {
                                $set: {
                                    "reactions.$.type": type,
                                },
                            };
                            result = await dbCollection.update(
                                {
                                    _id: message._id,
                                    "reactions.user": user.id,
                                },
                                update
                            );
                        } else {
                            // Incase user has never been reacted - Add new
                            const update = {
                                $push: {
                                    reactions: reactionInfo,
                                },
                            };
                            result = await dbCollection.updateById(
                                message._id,
                                update
                            );
                        }
                    } else if (lastReaction) {
                        // Incase user was reacted - remove
                        const update = {
                            $pull: {
                                reactions: {
                                    user: user.id,
                                },
                            },
                        };
                        result = await dbCollection.updateById(
                            message._id,
                            update
                        );
                    } else {
                        // Incase user has never been reacted and don't want to reaction
                        return null;
                    }
                }

                result == result || message;
                result.modification = [];
                cleanDbMark(result);

                const msgQueue = {
                    id: new Date().getTime(),
                    type: "message",
                    action: "reacted",
                    payload: {
                        id: result.id,
                        reactions: result.reactions,
                        from: result.from,
                        to: result.to
                    },
                };

                if (convInfo.subscribers && convInfo.subscribers.length > 0) {
                    // Save information to user queue
                    for (
                        let index = 0;
                        index < convInfo.subscribers.length;
                        index++
                    ) {
                        const subscriberId = convInfo.subscribers[index];
                        if (subscriberId == user.id) {
                            // Ignore reactor
                            continue;
                        }

                        try {
                            // Save new information to DB of corresponding user cache
                            const queueId = `msg-queue-${subscriberId}`;
                            const msgQueueCollection = await this.getDBCollection(
                                queueId
                            );
                            await msgQueueCollection.insert(
                                cleanDbMark(msgQueue)
                            );

                            const eventName = `message-queue.${subscriberId}.message.reacted`;
                            this.broker
                                .emit(eventName, msgQueue)
                                .catch(this.logger.error);
                        } catch (error) {
                            this.logger.warn(
                                "Could not save message to queue.",
                                msgQueue
                            );
                        }
                    }
                }

                // Broadcast message
                const eventName = `conversation.${conversationId}.message.updated.reacted`;
                this.broker.emit(eventName, result);

                return result;
            },
        },
    },

    /**
     * Methods
     */
    methods: {
        processMessage(message, isNew) {
            return message;
        },
        getHistoryCollectionName(conversation) {
            return `conv-history-${conversation}`;
        },
        async filterMessage(ctx) {
            const { conversation, history, id } = ctx.params;
            // Check conversation
            let convInfo = await ctx.call("v1.conversations.getConversationById", {
                id: conversation,
            });

            if (!convInfo) {
                throw new Errors.MoleculerClientError(
                    "The conversation could not be found.",
                    404
                );
            }

            try {
                const historyColl = this.getHistoryCollectionName(conversation);
                const dbCollection = await this.getDBCollection(historyColl);
                let result = null;

                // Get specified message
                if (id != null && id != undefined && id != null) {
                    result = await dbCollection.findOne({ id: id });
                    result = [result];
                } else {
                    let { limit, offset, sort } = ctx.params;
                    limit = limit != undefined ? limit : 50;
                    offset = offset != undefined ? offset : 0;
                    // Get list of message
                    const filter = {
                        limit,
                        offset,
                        sort: sort || ["id"],
                    };

                    result = await dbCollection.find(filter);
                }
                return result.map(record => {
                    if (history != true) {
                        delete record.modification;
                    }
                    return cleanDbMark(record);
                });
            } catch (error) {
                this.logger.error(error);
                throw new Errors.MoleculerServerError(error.message, 500);
            }
        },
        async updateMessage(message, ctx) {
            const conversationId = message.to.conversation;

            // Check conversation
            let convInfo = await ctx.call("v1.conversations.getConversationById", {
                id: conversationId,
            });

            if (!convInfo) {
                throw new Errors.MoleculerClientError(
                    "The conversation could not be found.",
                    404
                );
            }

            const convCollId = this.getHistoryCollectionName(conversationId);

            // Get adapter
            const dbCollection = await this.getDBCollection(convCollId);
            const oldEntity = await dbCollection.findOne({ id: message.id });

            // 1. Verify existing message
            if (!oldEntity) {
                // The message not found
                this.logger.warn("The message could not be found.");
                throw new Errors.MoleculerClientError(
                    "Original could not be found.",
                    400
                );
            }

            // 2. Update message
            const newEntity = message;
            // Update history
            const modification = oldEntity.modification || [];
            const history = oldEntity.body;
            history.updated = new Date();
            modification.unshift(history);
            newEntity.modification = modification;

            // 3.Update record in DB
            const update = {
                $set: newEntity,
            };

            const updatedEntity = await dbCollection.updateById(
                oldEntity._id,
                update
            );
            cleanDbMark(updatedEntity);

            const msgQueue = {
                id: new Date(payload.updated).getTime(),
                type: "message",
                action: "updated",
                payload: payload,
            };

            if (convInfo.subscribers && convInfo.subscribers.length > 0) {
                const payload = { ...updatedEntity };
                payload.modification = [];

                // 2. Save information to user queue
                for (
                    let index = 0;
                    index < convInfo.subscribers.length;
                    index++
                ) {
                    const userId = convInfo.subscribers[index];
                    if (userId == message.from.issuer) {
                        // Ignore issuer from subscribers
                        continue;
                    }

                    try {
                        // 2.1 Save new information to DB of corresponding user cache
                        const queueId = `msg-queue-${userId}`;
                        const msgQueueCollection = await this.getDBCollection(
                            queueId
                        );
                        await msgQueueCollection.insert(cleanDbMark(msgQueue));
                    } catch (error) {
                        this.logger.warn(
                            "Could not save message to queue.",
                            msgQueue
                        );
                    }
                }

                // 3. Send information to WS
                for (
                    let index = 0;
                    index < convInfo.subscribers.length;
                    index++
                ) {
                    const userId = convInfo.subscribers[index];
                    if (userId == message.from.issuer) {
                        // Ignore issuer from subscribers
                        continue;
                    }

                    // Send information to live-user directly
                    // If user confirm that they received a message, then the message wil be removed in DB
                    const eventName = `message-queue.${userId}.message.updated`;
                    this.broker
                        .emit(eventName, msgQueue)
                        .catch(this.logger.error);
                }
            }

            // Broadcast message
            const eventName = `conversation.${conversationId}.message.updated`;
            this.broker.emit(eventName, updatedEntity);

            return updatedEntity;
        },
        async storeMessage(message, ctx, convObj) {
            const conversationId = parseInt(message.to.conversation);
            const msgQueue = {
                id: message.id,
                type: "message",
                action: "created",
                payload: message,
            };

            let convInfo = convObj || (await ctx.call("v1.conversations.getConversationById", {
                id: conversationId,
            }));

            if (!convInfo) {
                throw new Errors.MoleculerClientError(
                    "The conversation could not be found.",
                    404
                );
            }

            if (!convInfo) {
                throw new Error("Conversation not found");
            }

            // 1 Save message to conversation collection in DB
            const convCollId = this.getHistoryCollectionName(conversationId);
            const dbCollection = await this.getDBCollection(convCollId);

            // Define default key
            message.modification = [];
            message.reactions = [];

            // Insert one more record
            const entity = dbCollection.insert(message);
            cleanDbMark(entity);

            if (convInfo.subscribers && convInfo.subscribers.length > 0) {
                // 2. Save information to user queue and send message to WS
                for (
                    let index = 0;
                    index < convInfo.subscribers.length;
                    index++
                ) {
                    const userId = convInfo.subscribers[index];
                    if (userId == message.from.issuer) {
                        // Ignore issuer from subscribers
                        continue;
                    }

                    try {
                        // 2.1 Save new information to DB of corresponding user cache
                        const queueId = `msg-queue-${userId}`;
                        const msgQueueCollection = await this.getDBCollection(
                            queueId
                        );
                        await msgQueueCollection.insert(cleanDbMark(msgQueue));
                    } catch (error) {
                        this.logger.warn(
                            "Could not save message to queue.",
                            msgQueue
                        );
                    }
                }

                // 3. Send message to WS
                for (
                    let index = 0;
                    index < convInfo.subscribers.length;
                    index++
                ) {
                    const userId = convInfo.subscribers[index];
                    if (userId == message.from.issuer) {
                        // Ignore issuer from subscribers
                        continue;
                    }

                    // Send information to live-user directly
                    // If user confirm that they received a message, then the message wil be removed in DB
                    const eventName = `message-queue.${userId}.message.created`;
                    this.broker
                        .emit(eventName, msgQueue)
                        .catch(this.logger.error);
                }
            }

            // Broadcast message
            const eventName = `conversation.${conversationId}.message.created`;
            this.broker.emit(eventName, entity);

            return entity;
        },
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

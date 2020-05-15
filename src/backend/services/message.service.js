"use strict";
const Errors = require("moleculer").Errors;
const DBCollectionService = require("../mixins/collection.db.mixin");
const { cleanDbMark } = require("../utils/entity");
const ControllerFactory = require("../message-controller/factory.js");

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
        async "conversation.*.removed"(payload, sender, event, ctx) {
            const [, convId, act] = event.split(".");
            const convCollId = this.getHistoryCollectionName(convId);

            if (act == "removed") {
                const dbCollection = await this.getDBCollection(convCollId);
                const collection = dbCollection.collection;
                const count = await collection.countDocuments();
                if (count > 0) {
                    this.logger.info("Deleting DB collection", convCollId);
                    return await collection.drop();
                }
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
                rightId: { type: "number", optional: true, convert: true },
                offset: { type: "number", optional: true, convert: true },
                top: { type: "number", optional: true, convert: true },
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
                        content: [{ type: "string" }, { type: "object" }],
                    },
                },
            },
            async handler(ctx) {
                const { conversation, body } = ctx.params;
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

                const controller = this.controllerFactory.getController(
                    message.body.type
                );
                return await controller
                    .inConversation(conversation)
                    .withContext(ctx)
                    .add(message)
                    .commit()
                    .then(cleanDbMark);
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
                    .inConversation(conversation)
                    .withContext(ctx)
                    .update(message)
                    .commit()
                    .then(cleanDbMark);

                // return await this.updateMessage(message, ctx);
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
                const controller = this.controllerFactory.getController("html");
                return await controller
                    .inConversation(conversationId)
                    .withContext(ctx)
                    .delete({ id })
                    .commit()
                    .then(cleanDbMark);
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
                        (i) => i.user == user.id
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
                        to: result.to,
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

                        // Save new information to DB of corresponding user cache
                        ctx.call("v1.messages-queue.pushMessageToQueue", {
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
                const eventName = `conversation.${conversationId}.message.updated.reacted`;
                this.broker
                    .broadcast(eventName, result)
                    .catch(this.logger.error);

                return result;
            },
        },
    },

    /**
     * Methods
     */
    methods: {
        processMessage(message, isNew) {
            // Update message type
            if (!message.body.type) {
                message.body.type = "html";
            }

            // Get processor to process message before store the message into DB
            const processor = this.msgFactory.getProcessor(message);
            if (processor) {
                const newMsg = processor.process(
                    message,
                    isNew ? "new" : "update"
                );
                message = newMsg || message;
            }

            // Check mentions
            if (message.mentions && message.mentions.length > 0) {
                const issuer = message.from.issuer;
                message.mentions = message.mentions.filter((u) => u !== issuer);
            }
            return message;
        },
        getHistoryCollectionName(conversation) {
            return `conv-history-${conversation}`;
        },
        checkCreatorRole(ctx, message) {
            const { user } = ctx.meta;
            if (user.id !== message.from.issuer) {
                this.logger.warn(
                    `${user.id} are not creator of the message ${message.id}.`
                );
                throw new Errors.MoleculerError(
                    "You are not allowed to update this message.",
                    401
                );
            }
        },
        async filterMessage(ctx) {
            const { conversation, history, id } = ctx.params;
            // Check conversation
            let convInfo = await ctx.call(
                "v1.conversations.getConversationById",
                {
                    id: conversation,
                }
            );

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
                    const { top, rightId } = ctx.params;

                    const query = {};
                    if (rightId) {
                        query.id = { $lt: rightId };
                    }

                    // Support get top
                    if (top) {
                        result = await dbCollection.collection
                            .find(query)
                            .sort({ $natural: -1 })
                            .limit(top)
                            .toArray();
                        result = result.reverse();
                    } else {
                        // The other cases
                        const { limit, sort, offset } = ctx.params;
                        const filter = { query };
                        const options = { sort, limit, offset };

                        Object.keys(options).forEach((key) => {
                            const val = options[key];
                            if (val) {
                                filter[key] = val;
                            }
                        });

                        result = await dbCollection.find(filter);
                    }
                }
                return result.map((record) => {
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

            const convCollId = this.getHistoryCollectionName(conversationId);

            // Get adapter
            const dbCollection = await this.getDBCollection(convCollId);
            const oldEntity = await dbCollection.findOne({ id: message.id });

            // Verify role
            this.checkCreatorRole(ctx, oldEntity);

            // 1. Verify existing message
            if (!oldEntity) {
                // The message not found
                this.logger.warn("The message could not be found.");
                throw new Errors.MoleculerClientError(
                    "Original could not be found.",
                    400
                );
            }

            // Verify role
            this.checkCreatorRole(ctx, oldEntity);

            // Process message
            const newMessage = this.processMessage(message, false);

            // 2. Update message
            const newEntity = newMessage;
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

            const payload = { ...updatedEntity };
            const msgQueue = {
                id: new Date(payload.updated).getTime(),
                type: "message",
                action: "updated",
                payload: payload,
            };

            if (convInfo.subscribers && convInfo.subscribers.length > 0) {
                payload.modification = [];

                // 2. Save information to user queue
                for (
                    let index = 0;
                    index < convInfo.subscribers.length;
                    index++
                ) {
                    const subscriberId = convInfo.subscribers[index];

                    // 2.1 Save new information to DB of corresponding user cache
                    ctx.call("v1.messages-queue.pushMessageToQueue", {
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
            const eventName = `conversation.${conversationId}.message.updated`;
            this.broker
                .broadcast(eventName, updatedEntity)
                .catch(this.logger.error);

            return updatedEntity;
        },
    },

    /**
     * Service created lifecycle event handler
     */
    created() {
        this.controllerFactory = new ControllerFactory(
            this.broker,
            this.logger
        );
    },

    /**
     * Service started lifecycle event handler
     */
    started() {},

    /**
     * Service stopped lifecycle event handler
     */
    stopped() {},
};

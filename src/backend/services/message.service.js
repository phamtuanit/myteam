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
                const { conversation, body } = ctx.params;
                const { user } = ctx.meta;
                // Check conversation
                this.checkConversation(conversation);

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

                const newMessage = this.processMessage(message, true);
                await this.storeMessage(newMessage, ctx);
                return newMessage;
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
                // Check conversation
                this.checkConversation(conversation);

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
                this.publishMessage(conversation, "updated", newMessage);
                return newMessage;
            },
        },
        removeMessage: {
            auth: true,
            roles: [1],
            rest: "DELETE /:id",
            params: {
                conversation: { type: "number", convert: true },
                id: "string",
            },
            handler(ctx) {
                const { conversation, id } = ctx.params;
                // Check conversation
                this.checkConversation(conversation);

                const message = { id };
                this.publishMessage(conversation, "delete", message);
                return message;
            },
        },
    },

    /**
     * Events
     */
    events: {
        //conversation.{conversation}.message.{act}`;
        // Ex: conversation.1584672834896.message.created
        "conversation.*.message.created"(payload, sender, event, ctx) {
            const [constVar, conversation, constMsg, act] = event.split(".");
        },
        //conversation.{conversation}.message.update`;
        "conversation.*.message.updated"(payload, sender, event, ctx) {
            const [constVar, conversation, constMsg, act] = event.split(".");
            const convCollId = `conv-history-${conversation}`;

            // Get adapter
            return this.getDBCollection(convCollId)
                .catch(err => {
                    this.logger.error(
                        "Could save updated message to DB.",
                        convCollId,
                        err
                    );
                    this.revertUpdatingMessage(ctx, payload, err);
                })
                .then(collection => {
                    return collection
                        .findOne({ id: payload.id })
                        .then(oldEntity => {
                            // 1. Verify message
                            if (!oldEntity) {
                                // The message not found
                                this.logger.warn(
                                    "The message could not be found."
                                );
                                // TODO: feedback to client
                                return;
                            }
                            // 2. Update message
                            const newEntity = payload;
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

                            return collection
                                .updateById(oldEntity._id, update)
                                .then(entity => {
                                    delete entity._id;
                                    // 4. Broadcast new change to users

                                    return entity;
                                });
                        })
                        .catch(err => {
                            this.logger.error(
                                "Could save updated message to DB.",
                                err
                            );
                            this.revertUpdatingMessage(ctx, payload, err);
                        });
                });
        },
        // message-queue.[userId].message.confirmed
        async "message-queue.*.message.confirmed"(payload, sender, event, ctx) {
            const [constVar, userId] = event.split(".");

            const queueId = `msg-queue-${userId}`;
            const dbCollection = await this.getDBCollection(queueId);

            const msg = await dbCollection.findOne({ id: payload.id });

            if (msg) {
                return dbCollection.removeById(msg._id);
            }
        },
    },

    /**
     * Methods
     */
    methods: {
        publishMessage(conversation, evtAction, message) {
            const eventName = `conversation.${conversation}.message.${evtAction}`;
            return this.broker.emit(eventName, message);
        },
        processMessage(message, isNew) {
            return message;
        },
        async checkConversation(convId) {
            const conversation = await this.getConversation(convId);
            if (!conversation) {
                throw new Errors.MoleculerClientError(
                    "The conversation could not be found.",
                    404
                );
            }
        },
        getConversation(convId) {
            return this.broker.call("v1.conversations.getConversation", {
                id: convId,
            });
        },
        getHistoryCollectionName(conversation) {
            return `conv-history-${conversation}`;
        },
        revertCreatingMessage(ctx, message, error) {
            const conversation = message.payload.to.conversation;
            const newMsg = { ...message };
            newMsg.error = error;

            const eventName = `conversation.${conversation}.message.rejected.create`;
            return this.broker.emit(eventName, newMsg);
        },
        revertUpdatingMessage(ctx, message, error) {
            const conversation = message.to.target;
            const newMsg = { ...message };
            newMsg.error = error;
            const eventName = `conversation.${conversation}.message.rejected.update`;
            return this.broker.emit(eventName, message);
        },
        async filterMessage(ctx) {
            const { conversation, history, id } = ctx.params;
            // Check conversation
            this.checkConversation(conversation);

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
        async storeMessage(message, ctx) {
            const conversationId = parseInt(message.to.conversation);
            const msgCache = {
                type: "message",
                action: "created",
                payload: message,
            };

            let convInfo = await ctx.call("v1.conversations.getConversation", {
                id: conversationId,
            });

            if (Array.isArray(convInfo)) {
                convInfo = convInfo.length > 0 ? convInfo[0] : null;
            }

            if (!convInfo) {
                throw new Error("Conversation not found");
            }

            // 1 Save message to conversation collection in DB
            const convCollId = this.getHistoryCollectionName(conversationId);
            const dbCollection = await this.getDBCollection(convCollId);
            // Insert one more record
            const entity = dbCollection.insert(message);

            // Clean _id
            cleanDbMark(msgCache);

            if (convInfo && convInfo.subscribers) {
                msgCache.id = new Date().getTime();

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

                    // 2.1 Save new information to DB of corresponding user cache
                    const queueId = `msg-queue-${userId}`;
                    const msgQueueCollection = await this.getDBCollection(
                        queueId
                    );
                    await msgQueueCollection.insert(msgCache);
                    // Clean _id
                    cleanDbMark(msgCache);

                    // 2.2 Send information to live-user directly
                    // If user confirm that they received a message, then the message wil be removed in DB
                    try {
                        const { status } = await ctx.call(
                            "v1.live.getUserById",
                            {
                                userId: userId,
                            }
                        );
                        if (status == "on") {
                            // Public message to online user . Pattern: [nodeId].message-queue.[userId].message.[action]
                            const eventName = `message-queue.${userId}.message.created`;
                            this.broker
                                .emit(eventName, msgCache)
                                .catch(this.logger.error);
                        }
                    } catch (err) {
                        this.logger.error(
                            "Could publish new message: ",
                            userId,
                            err
                        );
                    }
                }
            }

            return entity;
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

"use strict";
const Errors = require("moleculer").Errors;
const DBCollectionService = require("../mixins/collection.db.mixin");
const MessagePublisher = require("./message-publisher/redis.publisher");

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
                history: { type: "boolean", optional: true, convert: true }
            },
            async handler(ctx) {
                return this.filterMessage(ctx);
            }
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
                history: { type: "boolean", optional: true, convert: true }
            },
            handler(ctx) {
                return this.filterMessage(ctx);
            }
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
                        content: "object"
                    }
                }
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
                        edited: false
                    },
                    to: {
                        conversation
                    }
                };

                const newMessage = this.processMessage(message, true);
                this.publishMessage(conversation, "created", message);
                return newMessage;
            }
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
                        content: "object"
                    }
                }
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
                        edited: true
                    },
                    body
                };

                const newMessage = this.processMessage(message, false);
                this.publishMessage(conversation, "updated", newMessage);
                return newMessage;
            }
        },
        removeMessage: {
            auth: true,
            roles: [1],
            rest: "DELETE /:id",
            params: {
                conversation: { type: "number", convert: true },
                id: "string"
            },
            handler(ctx) {
                const { conversation, id } = ctx.params;
                // Check conversation
                this.checkConversation(conversation);

                const message = { id };
                this.publishMessage(conversation, "delete", message);
                return message;
            }
        }
    },

    /**
     * Events
     */
    events: {
        // [NodeID].[ChannelID].message.[create/update]
        "*.*.*.created"(payload, sender, event, ctx) {
            const [nodeId, conversation, messageConst, act] = event.split(".");
            const conversationId = parseInt(conversation);
            this.getConversation(conversationId)
                .catch(err => {
                    this.logger.error(
                        "Could get conversation information: ",
                        conversationId,
                        err
                    );
                    this.revertCreatingMessage(ctx, msgCache, err);
                })
                .then(conInfo => {
                    if (conInfo && conInfo.subscribers) {
                        const msgCache = {
                            id: new Date().getTime(),
                            type: "message",
                            action: act,
                            payload: payload
                        };
                        // 1. Save message to conversation collection in DB
                        const convCollId = this.getHistoryCollection(
                            conversation
                        );
                        this.getDBCollection(convCollId)
                            .then(collection => {
                                return collection.insert(payload).catch(err => {
                                    this.logger.error(
                                        "Could not store message to queue:",
                                        convCollId,
                                        err
                                    );
                                });
                            })
                            .catch(err => {
                                this.logger.error(
                                    "Could not get DB collection",
                                    convCollId,
                                    err
                                );
                                this.revertCreatingMessage(ctx, msgCache, err);
                            });

                        // 2. Public message to online subscribers or to cache in DB
                        conInfo.subscribers.forEach(userId => {
                            // if (userId === payload.from.issuer) {
                            //     // Ignore issuer from subscribers
                            //     return;
                            // }
                            // 1. Save new information to DB of corresponding user cache
                            const queueId = `msg-queue-${userId}`;
                            this.getDBCollection(queueId).then(collection => {
                                return collection
                                    .insert(msgCache)
                                    .catch(err => {
                                        this.logger.error(
                                            "Could not store message to queue: ",
                                            queueId,
                                            err
                                        );
                                        this.revertCreatingMessage(
                                            ctx,
                                            msgCache,
                                            err
                                        );
                                    });
                            });

                            // 2. Send information to live-user directly
                            // If user confirm that they received a message, then the message wil be removed in DB
                            this.broker
                                .call("v1.live.getUserStatusById", {
                                    userId: userId
                                })
                                .catch(err => {
                                    this.logger.error(
                                        "Could get user live status: ",
                                        userId,
                                        err
                                    );
                                    this.revertCreatingMessage(
                                        ctx,
                                        msgCache,
                                        err
                                    );
                                })
                                .then(({ status }) => {
                                    if (status == "on") {
                                        // Public message to live user - pattern: [userId].message.[action]
                                        const event = `message.${userId}.${act}`;
                                        return this.messagePublisher.publish(
                                            event,
                                            msgCache
                                        );
                                    }
                                })
                                .catch(err => {
                                    this.logger.error(
                                        "Could publish new message: ",
                                        userId,
                                        err
                                    );
                                    this.revertCreatingMessage(
                                        ctx,
                                        msgCache,
                                        err
                                    );
                                });
                        });
                    }
                });
        },
        "*.*.*.updated"(payload, sender, event, ctx) {
            const [nodeId, conversation, messageConst, act] = event.split(".");
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
                                $set: newEntity
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
        }
    },

    /**
     * Methods
     */
    methods: {
        publishMessage(conversation, evtAction, message) {
            const eventName = `${this.broker.nodeID}.${conversation}.message.${evtAction}`;
            return this.broker.emit(eventName, message, ["messages"]);
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
                id: convId
            });
        },
        getHistoryCollection(conversation) {
            return `conv-history-${conversation}`;
        },
        revertCreatingMessage(ctx, message, error) {
            const userId = message.payload.from.issuer;
            const event = `message.${userId}.rejected.created`;
            const newMsg = { ...message };
            newMsg.error = error;
            return this.messagePublisher.publish(event, newMsg);
        },
        revertUpdatingMessage(ctx, message, error) {
            const userId = message.payload.from.issuer;
            const event = `message.${userId}.rejected.updated`;
            const newMsg = { ...message };
            newMsg.error = error;
            return this.messagePublisher.publish(event, newMsg);
        },
        async filterMessage(ctx) {
            let { conversation, history } = ctx.params;
            // Check conversation
            this.checkConversation(conversation);

            let { id } = ctx.params;
            try {
                const historyColl = this.getHistoryCollection(conversation);
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
                        sort: sort || ["id"]
                    };

                    result = await dbCollection.find(filter);
                }
                return result.map(record => {
                    if (history != true) {
                        delete record.modification;
                    }
                    delete record._id;
                    return record;
                });
            } catch (error) {
                this.logger.error(error);
                throw new Errors.MoleculerServerError(error.message, 500);
            }
        }
    },

    /**
     * Service created lifecycle event handler
     */
    created() {
        this.messagePublisher = new MessagePublisher(
            "user-bus",
            this.broker,
            this.logger
        );
        this.messagePublisher.connect();
    },

    /**
     * Service started lifecycle event handler
     */
    started() {},

    /**
     * Service stopped lifecycle event handler
     */
    stopped() {
        this.messagePublisher.close();
    }
};

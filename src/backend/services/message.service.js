"use strict";
const DBCollectionService = require("../mixins/collection.db.mixin");

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
            rest: "GET /:conversation",
            params: {
                limit: { type: "number", optional: true, convert: true },
                offset: { type: "number", optional: true, convert: true },
                sort: { type: "array", optional: true },
                conversation: "string"
            },
            async handler(ctx) {
                let { limit, offset, conversation, id, sort } = ctx.params;
                limit = limit != undefined ? limit : 50;
                offset = offset != undefined ? offset : 0;
                const dbCollection = await this.getDBCollection(conversation);

                // Get specified message
                if (id != null && id != undefined && id != null) {
                    return await dbCollection.findOne({ id: id });
                }
                // Get list of message
                const filter = {
                    limit,
                    offset,
                    sort: sort || ["-arrivalTime"]
                };

                return this.convertEntitiesToResults(
                    await dbCollection.find(filter)
                );
            }
        },
        removeMessage: {
            auth: true,
            roles: [1],
            rest: "DELETE /:conversation",
            params: {
                id: "string",
                conversation: "string"
            },
            async handler(ctx) {
                const { conversation, id } = ctx.params;
                // Get adapter
                const dbCollection = await this.getDBCollection(conversation);

                const oldEntity = await dbCollection.findById(id);
                if (!oldEntity) {
                    throw new MoleculerClientError(
                        "The message could not be found.",
                        404
                    );
                }

                return this.convertEntitiesToResults(
                    await dbCollection.removeById(id)
                );
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
            this.conversationInfo
                .findOne({ id: conversationId })
                .then(conInfo => {
                    if (conInfo.subscribers) {
                        // 1. Save message to conversation collection in DB
                        const convCollId = `conv-history-${conversation}`;
                        this.getDBCollection(convCollId)
                            .then(collection => {
                                return collection.insert(payload).catch(err => {
                                    this.logger.error(
                                        "Could not store message to queue: ",
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
                            });

                        // 2. Public message online subscribers or to cache in DB
                        const msgCache = {
                            id: new Date().getTime(),
                            type: "message",
                            payload: payload
                        };
                        conInfo.subscribers.forEach(userId => {
                            if (userId === payload.from.issuer) {
                                // Ignore issuer from subscribers
                                return;
                            }
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
                                    });
                            });
                            // TODO: msg-queue-tuanp

                            // 2. Send information to live user directly
                            // If user confirm that they received a message, then the message wil be removed in DB
                            this.broker
                                .call("v1.live.getUserStatus", {
                                    userId: userId
                                })
                                .then(liveInfo => {
                                    if (liveInfo.status == "Online") {
                                        // Public message to live user
                                        return this.messagePublisher.publish(
                                            `${userId}`,
                                            msgCache,
                                            act
                                        );
                                    }
                                })
                                .catch(err => {
                                    this.logger.error(
                                        "Could get user live status: ",
                                        userId,
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
            return this.getDBCollection(convCollId).then(collection => {
                return collection
                    .findOne({ id: payload.id })
                    .then(oldEntity => {
                        // 1. Verify message
                        if (!oldEntity) {
                            // The message not found
                            this.logger.warn("The message could not be found.");
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
                    });
            });
        }
    },

    /**
     * Methods
     */
    methods: {},

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
    stopped() {}
};

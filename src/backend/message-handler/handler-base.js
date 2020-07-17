const MessageProcessorFactory = require("../message-processor/factory.js");
const Errors = require("moleculer").Errors;
const MongoDBAdapter = require("../db/mongo.adapter");
const { cleanDbMark } = require("../utils/entity");
module.exports = class HandlerBase {
    constructor(broker, logger, name) {
        this.broker = broker;
        this.logger = logger;
        this.name = name;
        this.convId = null;
        this.message = null;
        this.operation = "get";
        this.dbCollections = {};
        this.msgFactory = new MessageProcessorFactory(logger);
    }

    setConversation(convId) {
        this.convId = convId;
        return this;
    }

    setContext(ctx) {
        this.ctx = ctx;
        return this;
    }

    get() {
        this.operation = "get";
        return this;
    }

    getPinned(message) {
        this.message = message;
        this.operation = "getPinned";
        return this;
    }

    add(message) {
        this.message = message;
        this.operation = "add";
        return this;
    }

    update(message) {
        this.message = message;
        this.operation = "update";
        return this;
    }

    react(message) {
        this.message = message;
        this.operation = "react";
        return this;
    }

    pin(message) {
        this.message = message;
        this.operation = "pin";
        return this;
    }

    delete(message) {
        this.message = message;
        this.operation = "delete";
        return this;
    }

    async commit() {
        await this.checkConversationInfo();
        let latestMessage = this.message;

        switch (this.operation) {
            case "get":
                return await this.getMessage().then(cleanDbMark);
            case "getPinned":
                return await this.getPinnedMessage(this.message);
            case "add":
                latestMessage = await this.addMessage(this.message).then(
                    cleanDbMark
                );
                break;
            case "update":
                latestMessage = await this.editMessage(this.message);
                latestMessage = {
                    id: latestMessage.id,
                    updated: latestMessage.updated,
                    body: latestMessage.body,
                    edited: latestMessage.edited,
                    histories: latestMessage.histories,
                    mentions: latestMessage.mentions,
                    from: latestMessage.from,
                    to: latestMessage.to,
                };
                break;
            case "react":
                latestMessage = await this.reactMessage(this.message);
                latestMessage = {
                    id: latestMessage.id,
                    updated: new Date().getTime(),
                    reactions: latestMessage.reactions,
                    from: latestMessage.from,
                    to: latestMessage.to,
                };
                break;
            case "pin":
                latestMessage = await this.pinMessage(this.message);
                latestMessage = {
                    id: latestMessage.id,
                    updated: new Date().getTime(),
                    body: latestMessage.body,
                    pins: latestMessage.pins,
                    from: latestMessage.from,
                    to: latestMessage.to,
                };
                break;
            case "delete":
                latestMessage = await this.deleteMessage(this.message).then(
                    cleanDbMark
                );
                break;

            default:
                break;
        }

        this.notifyToUserQueue(latestMessage);
        return cleanDbMark(latestMessage);
    }

    /**
     * Protect method
     *
     */
    async checkConversationInfo() {
        // Verify conversation
        const conversationId = parseInt(this.convId);
        const convInfo = await this.ctx.call(
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

        if (!convInfo) {
            throw new Error("Conversation not found");
        }

        this.convInfo = convInfo;
    }

    /**
     * Protect method
     *
     */
    notifyToUserQueue(message) {
        const convInfo = this.convInfo;
        let act = "created";
        switch (this.operation) {
            case "update":
                act = "updated";
                break;
            case "delete":
                act = "removed";
                break;
            case "pin":
                act = "pinned";
                break;
            case "react":
                act = "reacted";
                break;

            default:
                break;
        }

        // Store information to message queue
        if (convInfo.subscribers && convInfo.subscribers.length > 0) {
            const msgQueue = {
                id: new Date().getTime(),
                type: "message",
                action: act,
                payload: message,
            };

            const ctx = this.ctx;
            for (let index = 0; index < convInfo.subscribers.length; index++) {
                const subscriberId = convInfo.subscribers[index];

                // Store information to message queue
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
        const eventName = `message.${message.id}.${act}`;
        this.broker.emit(eventName, message).catch(this.logger.error);
    }

    async getMessage() {
        const ctx = this.ctx;
        const { history, id } = ctx.params;
        const conversation = this.convId;
        const historyColl = this.getHistoryCollectionName(conversation);
        const dbCollection = await this.getDBCollection(historyColl);
        let message = null;

        try {
            if (id != null && id != undefined && id != null) {
                // Get specified message
                message = await dbCollection.findOne({ id: id });
                message = [message];
            } else {
                const { top, rightId, leftId } = ctx.params;
                const query = { id: {} };

                if (rightId) {
                    // Less than rightId
                    query.id.$lt = rightId;
                }

                if (leftId) {
                    // More than rightId
                    query.id.$gt = leftId;
                }

                if (Object.keys(query.id).length == 0) {
                    delete query.id;
                }

                // Support get Top messages
                if (top) {
                    message = await dbCollection.collection
                        .find(query)
                        .sort({ $natural: -1 })
                        .limit(top)
                        .toArray();
                    message = message.reverse();
                } else {
                    // The other cases
                    const { limit, sort, offset } = ctx.params;
                    const options = { sort, limit, offset };
                    const filter = { query };

                    // Build query
                    Object.keys(options).forEach((key) => {
                        const val = options[key];
                        if (val) {
                            filter[key] = val;
                        }
                    });

                    message = await dbCollection.find(filter);
                }
            }

            // Correct output
            return message.map((record) => {
                if (history != true) {
                    delete record.histories;
                }
                return cleanDbMark(record);
            });
        } catch (error) {
            this.logger.error(error);
            throw new Errors.MoleculerServerError(error.message, 500);
        }
    }

    async getPinnedMessage({ userId, top, rightId }) {
        const convId = this.convId;
        const historyColl = this.getHistoryCollectionName(convId);
        const dbCollection = await this.getDBCollection(historyColl);
        const query = {};

        if (rightId) {
            // Less than rightId
            query.id.$lt = rightId;
        }

        if (userId) {
            query.pins = {
                $in: userId,
            };
        } else {
            query.pins = { $exists: true, $ne: [] };
        }

        let messages = [];
        // Support get Top messages
        messages = await dbCollection.collection
            .find(query)
            .sort({ $natural: -1 })
            .limit(top || 10)
            .toArray();
        messages = messages.reverse();

        return messages.map(msg => {
            delete msg.mentions;
            delete msg.histories;
            delete msg.reactions;
            return cleanDbMark(msg);
        });
    }

    /**
     * Protect method
     *
     */
    async addMessage({ body }) {
        const { user } = this.ctx.meta;
        let message = {
            id: new Date().getTime(),
            from: {
                issuer: user.id,
            },
            to: {
                conversation: this.convId,
            },
            created: new Date().getTime(),
            edited: false,
            body,
            histories: [],
            reactions: [],
            mentions: [],
        };

        message = this.processMessage(message);
        const convCollId = this.getHistoryCollectionName(this.convId);
        const dbCollection = await this.getDBCollection(convCollId);
        return await dbCollection.insert(message);
    }

    /**
     * Protect method
     *
     */
    async editMessage(message) {
        const convCollId = this.getHistoryCollectionName(this.convId);
        const dbCollection = await this.getDBCollection(convCollId);

        const { id: messageId } = this.ctx.params;
        const existingMessage = await dbCollection.findOne({ id: messageId });

        if (!existingMessage) {
            throw new Errors.MoleculerClientError(
                "The message could not be found.",
                404
            );
        }

        const { user } = this.ctx.meta;
        if (user.id !== existingMessage.from.issuer) {
            this.logger.warn(
                `${user.id} are not creator of the message ${messageId}.`
            );
            throw new Errors.MoleculerError(
                "You are not allowed to update this message.",
                401
            );
        }

        message = this.processMessage(this.message);
        message.edited = true;

        // Update history
        const histories = existingMessage.histories || [];
        const history = existingMessage.body;
        history.updated = new Date().getTime();
        histories.unshift(history);
        message.histories = histories;

        // Update record in DB
        const update = {
            $set: message,
        };

        return await dbCollection.updateById(existingMessage._id, update);
    }

    /**
     * Protect method
     *
     */
    async reactMessage({ id, type, operation }) {
        const convCollId = this.getHistoryCollectionName(this.convId);

        // Get adapter
        const dbCollection = await this.getDBCollection(convCollId);
        const existingMessage = await dbCollection.findOne({ id: id });

        if (!existingMessage) {
            throw new Errors.MoleculerClientError(
                "The message could not be found.",
                404
            );
        }

        const user = this.ctx.meta.user;
        let latestMessage = existingMessage;
        const reactionInfo = {
            user: user.id,
            type,
        };

        if (!existingMessage.reactions) {
            // Incase reactions is null
            if (operation == true) {
                const update = {
                    $set: {
                        reactions: [reactionInfo],
                    },
                };

                // Set reactions
                latestMessage = await dbCollection.updateById(
                    existingMessage._id,
                    update
                );
            }
        } else {
            const lastReaction = existingMessage.reactions.find(
                (i) => i.user == user.id
            );

            if (operation == true) {
                if (lastReaction != null) {
                    // Incase user was reacted -> change type only
                    const update = {
                        $set: {
                            "reactions.$.type": type,
                        },
                    };

                    // Change reaction type
                    latestMessage = await dbCollection.update(
                        {
                            _id: existingMessage._id,
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

                    // Add new one into reactions list
                    latestMessage = await dbCollection.updateById(
                        existingMessage._id,
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

                // Remove reaction
                latestMessage = await dbCollection.updateById(
                    existingMessage._id,
                    update
                );
            }
        }

        return latestMessage;
    }

    /**
     * Protect method
     *
     */
    async deleteMessage({ id }) {
        const convCollId = this.getHistoryCollectionName(this.convId);
        const dbCollection = await this.getDBCollection(convCollId);
        const entity = await dbCollection.findOne({ id });

        // 1. Verify existing message
        if (!entity) {
            // The message not found
            this.logger.warn("The message could not be found.");
            return;
        }

        const { user } = this.ctx.meta;
        if (user.id !== entity.from.issuer) {
            this.logger.warn(
                `${user.id} are not creator of the message ${entity.id}.`
            );
            throw new Errors.MoleculerError(
                "You are not allowed to delete this message.",
                401
            );
        }

        // 2. Delete record
        entity.deleted = new Date();
        return await dbCollection.removeById(entity._id);
    }

    /**
     * Protect method
     *
     */
    async pinMessage({ id, operation: status }) {
        const convCollId = this.getHistoryCollectionName(this.convId);

        // Get adapter
        const dbCollection = await this.getDBCollection(convCollId);
        const existingMessage = await dbCollection.findOne({ id: id });

        if (!existingMessage) {
            throw new Errors.MoleculerClientError(
                "The message could not be found.",
                404
            );
        }

        const user = this.ctx.meta.user;
        let latestMessage = existingMessage;

        if (!existingMessage.pins) {
            // Incase reactions is null
            if (status == true) {
                const update = {
                    $set: {
                        pins: [user.id],
                    },
                };

                // Set pin
                latestMessage = await dbCollection.updateById(
                    existingMessage._id,
                    update
                );
            }
        } else {
            const hasPinned =
                existingMessage.pins.find((u) => u == user.id) != null;

            if (status == true && hasPinned == false) {
                // Incase user has never pinned - Add new
                const update = {
                    $push: {
                        pins: user.id,
                    },
                };

                // Add new one into reactions list
                latestMessage = await dbCollection.updateById(
                    existingMessage._id,
                    update
                );
            } else if (hasPinned == true) {
                // Incase user was reacted - remove
                const update = {
                    $pull: {
                        pins: user.id,
                    },
                };

                // Remove reaction
                latestMessage = await dbCollection.updateById(
                    existingMessage._id,
                    update
                );
            }
        }

        return latestMessage;
    }

    /**
     * Protect method
     *
     */
    processMessage(message) {
        if (this.operation == "delete") {
            return message;
        }
        try {
            // Get processor to process message before store the message into DB
            const processor = this.msgFactory.getProcessor(message.body.type);
            if (processor) {
                const newMsg = processor.process(message);
                message = newMsg || message;
            }
        } catch (error) {
            console.warn("Cannot process message.", error);
        }
        return message;
    }

    /**
     * Protect method
     *
     */
    getDBCollection(collection) {
        collection = "" + collection; // To string
        if (!this.dbCollections[collection]) {
            const gettingTask = new Promise((resolve, reject) => {
                const dbCl = MongoDBAdapter(collection, this);
                dbCl.connect()
                    .then(() => {
                        resolve(dbCl);
                        this.logger.debug(
                            "[DB] Collection adapter is ready",
                            collection
                        );
                    })
                    .catch((err) => {
                        this.logger.warn(err);
                        reject(err.message);
                        delete this.dbCollections.collection;
                    });
            });
            this.dbCollections[collection] = gettingTask;
            return gettingTask;
        }
        return Promise.resolve(this.dbCollections[collection]);
    }

    getHistoryCollectionName(convId) {
        return `conv-history-${convId}`;
    }

    clean() {
        Object.values(this.dbCollections).forEach((db) => {
            db.then((db) => {
                this.logger.info("[DB] Disconnect DB");
                db.disconnect();
            });
        });
    }
};

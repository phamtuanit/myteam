const MessageProcessorFactory = require("../message-processor/factory.js");
const Errors = require("moleculer").Errors;
const MongoDBAdapter = require("../db/mongo.adapter");
const { cleanDbMark } = require("../utils/entity");
module.exports = class ControllerBase {
    constructor(broker, logger, name) {
        this.broker = broker;
        this.logger = logger;
        this.name = name;
        this.convId = null;
        this.message = null;
        this.operation = "add";
        this.conversation = null;
        this.dbCollections = {};
        this.msgFactory = new MessageProcessorFactory(logger);
    }

    inConversation(convId) {
        this.convId = convId;
        return this;
    }

    withContext(ctx) {
        this.ctx = ctx;
        return this;
    }

    add(message) {
        this.message = message;
        this.operation = "add";

        // Define default key
        message.modification = message.modification || [];
        message.reactions = message.reactions || [];
        message.mentions = message.mentions || [];
        return this;
    }

    update(message) {
        this.message = message;
        this.operation = "update";
        return this;
    }

    delete(message) {
        this.message = message;
        this.operation = "delete";
        return this;
    }

    async commit() {
        await this.checkConversationInfo();
        this.conversation = this.getDBCollection(this.convId);
        this.message = this.processMessage(this.message);
        let latestMessage = null;

        switch (this.operation) {
            case "add":
                latestMessage = await this.addMessage(this.message);
                break;
            case "update":
                latestMessage = await this.editMessage(this.message);
                break;
            case "delete":
                latestMessage = await this.deleteMessage(this.message);
                break;

            default:
                break;
        }

        this.notifyToUserQueue(cleanDbMark(latestMessage));
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
            case "edit":
                act = "updated";
                break;
            case "delete":
                act = "removed";
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
        const eventName = `conversation.${this.convId}.message.${act}`;
        this.broker.broadcast(eventName, message).catch(this.logger.error);
    }

    /**
     * Protect method
     *
     */
    processMessage(message) {
        if (this.operation == "delete") {
            return message;
        }
        // Get processor to process message before store the message into DB
        const processor = this.msgFactory.getProcessor(message.body.type);
        if (processor) {
            const newMsg = processor.process(message);
            message = newMsg || message;
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
                            ">>>> Collection adapter is ready",
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

    /**
     * Protect method
     *
     */
    async addMessage(message) {
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

        // Get adapter
        const dbCollection = await this.getDBCollection(convCollId);

        const { id } = this.ctx.params;
        const oldEntity = await dbCollection.findOne({ id: id });

        if (!oldEntity) {
            throw new Errors.MoleculerClientError(
                "The conversation could not be found.",
                404
            );
        }

        const { user } = this.ctx.meta;
        if (user.id !== oldEntity.from.issuer) {
            this.logger.warn(
                `${user.id} are not creator of the message ${oldEntity.id}.`
            );
            throw new Errors.MoleculerError(
                "You are not allowed to update this message.",
                401
            );
        }

        message.from = oldEntity.from;
        message.from.edited = true;

        // Update history
        const modification = oldEntity.modification || [];
        const history = oldEntity.body;
        history.updated = new Date();
        modification.unshift(history);
        message.modification = modification;

        // 3.Update record in DB
        const update = {
            $set: message,
        };

        return await dbCollection.updateById(oldEntity._id, update);
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

    clean() {
        Object.values(this.dbCollections).forEach((db) => {
            db.then((db) => {
                this.logger.info(">>>> Disconnect to DB");
                db.disconnect();
            });
        });
    }
};

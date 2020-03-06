"use strict";
const MongoDBAdapter = require("../db/mongo.adapter");
const MsgPublisher = require("./message-publisher/message-publisher");
const RoomSubscriber = require("./message-subscriber/room-subscriber");
const { MoleculerClientError } = require("moleculer").Errors;

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
    name: "messages",
    version: 1,
    settings: {},
    dependencies: [],
    mixins: [],
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
                    return await dbCollection.findOne({id: id});
                }
                // Get list of message
                const filter = {
                    limit,
                    offset,
                    sort: sort || ["-arrivalTime"],
                };

                return this.convertEntitiesToResults(
                    await dbCollection.find(filter)
                );
            }
        },
        postMessage: {
            auth: true,
            roles: [1],
            rest: "POST /:conversation",
            params: {
                conversation: "string",
                body: {
                    type: "object",
                    props: {
                        type: { type: "string" },
                        content: "object"
                    }
                }
            },
            handler(ctx) {
                const { conversation, body } = ctx.params;
                const { user } = ctx.meta;
                const message = {
                    arrivalTime: new Date(),
                    id: new Date().getTime(), // The Id to confirm message state in Client side
                    from: {
                        issuer: user.id,
                        edited: false
                    },
                    to: {
                        target: conversation
                    },
                    body,
                    modification: []
                };

                const newMessage = this.processMessage(message);
                this.messagePublisher.publish(conversation, "create", newMessage);
                return newMessage;

                // const dbCollection = await this.getDBCollection(conversation);
                // return this.convertEntitiesToResults(
                //     await dbCollection.insert(entity)
                // );
            }
        },
        updateMessage: {
            auth: true,
            roles: [1],
            rest: "PUT /:conversation",
            params: {
                id: "string",
                conversation: "string",
                body: {
                    type: "object",
                    props: {
                        type: { type: "string" },
                        content: "object"
                    }
                }
            },
            async handler(ctx) {
                const { conversation, id, body } = ctx.params;
                // Get adapter
                const dbCollection = await this.getDBCollection(conversation);

                const oldEntity = await dbCollection.findById(id);
                if (!oldEntity) {
                    throw new MoleculerClientError(
                        "The message could not be found.",
                        400
                    );
                }

                const oldBody = oldEntity.body;
                const entity = { ...oldEntity };
                entity.updated = new Date();
                entity.body = body;
                entity.from.edited = true;
                // Update history
                const modification = entity.modification || [];
                const history = {
                    updated: new Date(),
                    content: oldBody.content
                };
                modification.unshift(history);
                entity.modification = modification;

                // Update DB
                const update = {
                    $set: entity
                };

                return this.convertEntitiesToResults(
                    await dbCollection.updateById(id, update)
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
    events: {},

    /**
     * Methods
     */
    methods: {
        async getDBCollection(collection) {
            if (!this.dbCollections[collection]) {
                const dbCl = MongoDBAdapter(collection, this);
                this.dbCollections[collection] = dbCl;
                this.logger.info("Created collection adapter:", collection);
                await dbCl.connect();
                return dbCl;
            }
            return this.dbCollections[collection];
        },
        convertEntitiesToResults(entity) {
            let updateIdFn = ent => {
                ent.id = ent._id;
                delete ent._id;
                return ent;
            };

            if (!Array.isArray(entity)) {
                return updateIdFn(entity);
            }

            return entity.map(updateIdFn);
        },
        convertDataToEntities(data) {
            let updateIdFn = ent => {
                ent._id = ent.id;
                delete ent.id;
                return ent;
            };

            if (!Array.isArray(data)) {
                return updateIdFn(data);
            }

            return data.map(updateIdFn);
        },
        processMessage(message) {
            return message;
            
        }
    },

    /**
     * Service created lifecycle event handler
     */
    created() {
        this.dbCollections = {};
        this.messagePublisher = new MsgPublisher("global-publisher", this.broker, this.logger);
        this.messagePublisher.init();
        this.roomSubscriber = new RoomSubscriber("global-room", this.logger);
        this.roomSubscriber.init();
    },

    /**
     * Service started lifecycle event handler
     */
    started() {
        this.roomSubscriber.subscribe();
    },

    /**
     * Service stopped lifecycle event handler
     */
    stopped() {
        this.dbCollections.forEach(db => {
            db.disconnect();
        });
    }
};

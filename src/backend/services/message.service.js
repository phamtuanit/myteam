"use strict";
const MongoDBAdapter = require("../db/mongo.adapter");
const { MoleculerClientError } = require("moleculer").Errors;

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
    name: "message",
    version: 1,
    settings: {},
    dependencies: [],
    mixins: [],
    actions: {
        getMessages: {
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
                    return await dbCollection.findById(id);
                }
                // Get list of message
                const filter = {
                    limit,
                    offset,
                    sort: sort || ["-createdTime"],
                    query: {}
                };

                return this.convertEntitiesToResults(
                    await dbCollection.find(filter)
                );
            }
        },
        postMessage: {
            rest: "POST /:conversation",
            params: {
                conversation: "string",
                body: {
                    type: "object",
                    props: {
                        type: { type: "string" },
                        content: "object"
                    }
                },
                from: {
                    type: "object",
                    props: {
                        issuer: { type: "number", convert: true }
                    }
                }
            },
            async handler(ctx) {
                const { conversation, from, body } = ctx.params;
                const entity = {
                    createdTime: new Date(),
                    from,
                    body,
                    modification: []
                };
                entity.from.edited = false;

                const dbCollection = await this.getDBCollection(conversation);
                return this.convertEntitiesToResults(
                    await dbCollection.insert(entity)
                );
            }
        },
        updateMessage: {
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
                entity.updatedTime = new Date();
                entity.body = body;
                entity.from.edited = true;
                // Update history
                const modification = entity.modification || [];
                modification.unshift(oldBody);
                entity.modification = modification;
                const update = {
                    $set: entity
                };

                return this.convertEntitiesToResults(
                    await dbCollection.updateById(id, update)
                );
            }
        },
        removeMessage: {
            rest: "DELETE /:conversation",
            params: {
                id: "string",
                conversation: "string",
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
        }
    },

    /**
     * Service created lifecycle event handler
     */
    created() {
        this.dbCollections = {};
    },

    /**
     * Service started lifecycle event handler
     */
    async started() {},

    /**
     * Service stopped lifecycle event handler
     */
    async stopped() {
        this.dbCollections.forEach(db => {
            db.disconnect();
        });
    }
};

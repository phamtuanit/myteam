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
    dependencies: [],
    mixins: [DBCollectionService],
    actions: {
        createConversation: {
            auth: true,
            roles: [1],
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
                const { channel } = ctx.params;
                const { user } = ctx.meta;
                // Get adapter
                const dbCollection = await this.getDBCollection(
                    "conversations"
                );

                const newConvInfo = channel;
                newConvInfo.id = new Date().getTime();
                newConvInfo.creator = user.id;
                newConvInfo.created = new Date();

                const newConv = await (dbCollection.insert(newConvInfo).then(cleanDbMark));
                this.logger.info(
                    "Added new conversation.",
                    newConv.id
                );

                // Broadcast message
                const eventName = `conversation.${newConv.id}.created`;
                this.broker.emit(eventName, newConv).catch(this.logger.error);
                return newConv;
            },
        },
        getConversationById: {
            auth: true,
            roles: [1],
            rest: "GET /:id",
            params: {
                id: { type: "number", convert: true },
            },
            handler(ctx) {
                const { id } = ctx.params;
                return this.getDBCollection("conversations").then(
                    collection => {
                        return collection.findOne({ id }).then(cleanDbMark);
                    }
                );
            },
        },
        getConversation: {
            auth: true,
            roles: [1],
            rest: "GET /",
            params: {
                limit: { type: "number", optional: true, convert: true },
                offset: { type: "number", optional: true, convert: true },
                sort: { type: "array", optional: true, convert: true },
                user: { type: "string", optional: true },
                channel: {
                    type: "boolean",
                    optional: true,
                    convert: true,
                },
            },
            handler(ctx) {
                const { user, sort, channel } = ctx.params;
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
                    const users = user.split(",");
                    if (users.length > 0) {
                        filter.query.subscribers = {
                            $in: users,
                        };
                    } else {
                        filter.query.subscribers = {
                            $in: user,
                        };
                    }
                }

                return this.getDBCollection("conversations").then(
                    collection => {
                        return collection.find(filter).then(records => {
                            return records.map(cleanDbMark);
                        });
                    }
                );
            },
        },
        updateConversation: {
            auth: true,
            roles: [1],
            rest: "PUT /:id",
            params: {
                id: "number",
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

                const existingConv = await dbCollection.findOne({ id: convId || channel.id });

                if (!existingConv) {
                    // The conversation not found
                    this.logger.warn("The conversation could not be found.", channel.id);
                    throw new Errors.MoleculerError("The conversation could not be found.", 404);
                }

                this.checkCreatorRole(ctx, existingConv);
                channel.updated = new Date();

                const updatedEntity = await (dbCollection.updateById(
                    existingConv._id,
                    { $set: channel }
                ).then(cleanDbMark));

                // Broadcast message
                const eventName = `conversation.${updatedEntity.id}.updated`;
                this.broker.emit(eventName, updatedEntity).catch(this.logger.error);
                return updatedEntity;
            },
        },
        deleteConversation: {
            auth: true,
            roles: [1],
            rest: "DELETE /:id",
            params: {
                id: "number",
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
                    this.logger.warn("The conversation could not be found.", convId);
                    throw new Errors.MoleculerError("The conversation could not be found.", 404);
                }

                existingConv.deleted = new Date();
                await dbCollection.removeById(existingConv._id);
                cleanDbMark(existingConv);

                // Broadcast message
                const eventName = `conversation.${existingConv.id}.removed`;
                this.broker.emit(eventName, existingConv).catch(this.logger.error);
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
                this.logger.warn(`${user.id} are not admin of this channel ${conv.id}.`);
                throw new Errors.MoleculerError("You are not admin of this channel.", 401);
            }
        }
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

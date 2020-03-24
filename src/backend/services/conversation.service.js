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
                group: {
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
                const { group } = ctx.params;
                // Get adapter
                const dbCollection = await this.getDBCollection(
                    "conversations"
                );

                const newConvInfo = group;
                newConvInfo.id = new Date().getTime();

                const existingConv = await dbCollection.insert(newConvInfo);
                this.logger.info(
                    "Could not insert conversation.",
                    existingConv._id
                );
                cleanDbMark(existingConv);
                return existingConv;
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
                    default: false,
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
                    query: {
                        channel,
                    },
                };

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
    stopped() {},
};

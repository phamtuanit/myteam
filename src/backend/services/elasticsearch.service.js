"use strict";
const Errors = require("moleculer").Errors;
const DBCollectionService = require("../mixins/collection.db.mixin");
const dbConf = require("../conf/db.json");
const { cleanDbMark } = require("../utils/entity");
const { Client: ESClient } = require('@elastic/elasticsearch');
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
    name: "elasticsearch",
    version: 1,
    settings: {},
    dependencies: ["v1.messages"],
    mixins: [DBCollectionService],
    actions: {
        search: {
            auth: true,
            roles: [-1],
            rest: "POST /search",
            params: {
                conversation: { type: "number", convert: true },
                criterial: {
                    type: "object",
                    props: {
                        text: { type: "string" },
                        query: { type: "object", optional: true},
                    },
                }
            },
            async handler(ctx) {
                // Need to verify user and conversation first
                await this.verifyUser(ctx);

                const { conversation: convId, criterial } = ctx.params;
                const query = {};

                if (criterial.text) {
                    const textQuery = {
                        bool: {
                            should: [
                                {
                                    match: {
                                        "body.html": criterial.text,
                                    },
                                },
                                {
                                    match: {
                                        "body.text": criterial.text,
                                    },
                                },
                            ],
                        },
                    };

                    // Assign text query
                    Object.assign(query, textQuery);
                }

                // Assign user's query
                criterial.query && Object.assign(query, criterial.query);

                // Execute query
                const esIndex = this.getESConvIndex(convId);
                const response = await this.es.search({
                    index: esIndex,
                    body: {
                        query: query,
                    },
                });

                if (response.body.hits && response.body.hits.hits) {
                    const result = response.body.hits;
                    // Flat result
                    result.hits = result.hits.map(item => {
                        return item._source;
                    });

                    return {
                        total: result.total,
                        results: result.hits
                    };
                }

                return { total: {}, results: [] };
            },
        },
    },

    /**
     * Events
     */
    events: {
        async "messages.*"(message, sender, event) {
            const [, act] = event.split(".");
            const convId = message.to.conversation;
            const esIndex = this.getESConvIndex(convId);
            const msgId = "" + message.id;
            switch (act) {
                case "created":
                    await this.es.index({
                        index: esIndex,
                        id: msgId,
                        body: {
                            id: message.id,
                            created: message.created,
                            issuer: message.from.issuer,
                            body: this.getESMessageBodyByType(message),
                        },
                    }).catch(err => {
                        this.logger.error("Could not insert message into ES.", message.id, err);
                    });
                    break;
                case "updated":
                    await this.es
                        .update({
                            index: esIndex,
                            id: msgId,
                            refresh: true,
                            body: {
                                doc: {
                                    body: this.getESMessageBodyByType(message),
                                },
                            },
                        })
                        .catch((err) => {
                            this.logger.error(
                                "Could not update message into ES.",
                                message.id,
                                err
                            );
                        });
                    break;
                case "removed":
                    await this.es
                        .delete({
                            index: esIndex,
                            id: msgId,
                            refresh: true
                        })
                        .catch((err) => {
                            this.logger.error(
                                "Could not remove message from ES.",
                                message.id,
                                err
                            );
                        });
                    break;

                default:
                    break;
            }
        },
    },

    /**
     * Methods
     */
    methods: {
        getESConvIndex(convId) {
            return dbConf.elasticsearch["conv-history-template"] + convId;
        },
        getESMessageBodyByType(message) {
            if (!message.body.type || message.body.type === "html") {
                return {
                    html: message.body.content,
                    type: message.body.type || "html"
                };
            }

            return {
                text: message.body.content,
                type: message.body.type
            };
        },
        async verifyUser(ctx) {
            // Verify conversation
            const { user } = ctx.meta;
            const { conversation } = ctx.params;
            const conversationId = parseInt(conversation);
            const convInfo = await ctx.call(
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

            if (!convInfo.subscribers.includes(user.id)) {
                throw new Errors.MoleculerClientError(
                    "You are not in the conversation.",
                    401
                );
            }

            return convInfo;
        },
    },

    /**
     * Service created lifecycle event handler
     */
    created() {},

    /**
     * Service started lifecycle event handler
     */
    async started() {
        this.es = new ESClient({ node: dbConf.elasticsearch.uri });
    },

    /**
     * Service stopped lifecycle event handler
     */
    stopped() {},
};

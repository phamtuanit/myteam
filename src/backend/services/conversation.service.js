"use strict";
const DBCollectionService = require("../mixins/collection.db.mixin");
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
                        name: "string",
                        subscribers: { type: "array", empty: false },
                    }
                }
            },
            async handler(ctx) {
                const { group } = ctx.params;
                // Get adapter
                const dbCollection = await this.getDBCollection("conversations");
                // 1. Create new conversation information first
                const newConvInfo = group;
                newConvInfo.id = new Date().getTime();

                const existinConv = await dbCollection.insert(newConvInfo);
                this.logger.info("Could not get conversation information. Created new one.", existinConv._id);
                delete existinConv._id;
                return existinConv;
            }
        },
        getConversation: {
            visibility: "public",
            params: {
                id: { type: "number", convert: true },
            },
            handler(ctx) {
                const { id } = ctx.params;

                return this.getDBCollection("conversations").then(collection => {
                    return collection.findOne({ id });
                });
            }
        }
    },

    /**
     * Methods
     */
    methods: {
    },

    /**
     * Service created lifecycle event handler
     */
    created() {
    },

    /**
     * Service started lifecycle event handler
     */
    started() { },

    /**
     * Service stopped lifecycle event handler
     */
    stopped() { }
};
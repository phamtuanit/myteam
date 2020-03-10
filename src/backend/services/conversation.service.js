"use strict";
const DBCollectionService = require("../mixins/collection.db.mixin");

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
                    body
                };

                const newMessage = this.processMessage(message, true);
                this.publishMessage(conversation, "created", message);
                return newMessage;
            }
        },
        updateMessage: {
            auth: true,
            roles: [1],
            rest: "PUT /:conversation",
            params: {
                id: { type: "number", convert: true },
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
                const { conversation, body, id } = ctx.params;
                const { user } = ctx.meta;
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
        }
    },

    /**
     * Methods
     */
    methods: {
        publishMessage(conversation, evtAction, message) {
            const eventName = `${this.broker.nodeID}.${conversation}.message.${evtAction}`;
            this.broker.emit(eventName, message, ["messages"]);
        },
        processMessage(message, isNew) {
            return message;
        }
    },

    /**
     * Service created lifecycle event handler
     */
    async created() {
        // Prepare conversation information collection
        // this.conversationInfo = await this.getDBCollection("conversations");
    },

    /**
     * Service started lifecycle event handler
     */
    started() {},

    /**
     * Service stopped lifecycle event handler
     */
    stopped() {}
};

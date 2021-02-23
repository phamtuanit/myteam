"use strict";
const axios = require("axios");
const https = require("https");
const Extnotifier = require("./ext-notifier");
const Errors = require("moleculer").Errors;
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
    name: "webhook",
    version: 1,
    settings: {},
    dependencies: ["v1.auth", "v1.authorization"],
    mixins: [Extnotifier],
    actions: {
    },

    /**
     * Events
     */
    events: {
        // user.connected
        "messages.*"(message, sender, event) {
            if (!message.to || !message.from) {
                this.logger.warn("Could process this event. Missing important information.", event, message);
                return;
            }

            const [, act] = event.split(".");
            return this.processMessage(message, act).catch(this.logger.warn);
        },
    },

    /**
     * Methods
     */
    methods: {
        async processMessage(message, action) {
            const convInfo = await this.getConversation(message.to.conversation);

            if (!convInfo) {
                throw new Errors.MoleculerClientError("The conversation could not be found.", 404);
            }

            if (!convInfo.webhook || convInfo.webhook.enable != true || !convInfo.webhook.subscribers || convInfo.webhook.subscribers.length == 0) {
                this.logger.debug("The conversation doesn't support webhook.", convInfo.id, convInfo.webhook && convInfo.webhook.enable);
                return;
            }

            const publisher = await this.broker.call("v1.users.getUserById", { id: message.from.issuer, });
            convInfo.webhook.subscribers.forEach(subscriber => {
                if (subscriber.enable != false) {
                    this.notifyToSubscriber(subscriber, convInfo, publisher, message, "message", action);
                } else {
                    this.logger.debug("The subscriber is disabled currentlly.", subscriber);
                }
            });
        },
        getConversation(convId) {
            const conversationId = parseInt(convId);
            return this.broker.call("v1.conversations.getConversationByIdLocal", { id: conversationId});
        },
        async notifyToSubscriber(subscriber, convInfo, publisher, message, type, action) {
            if (!subscriber.routes || typeof subscriber.routes != "object" || !subscriber.routes[type]
                || Object.keys(subscriber.routes[type]).length == 0) {
                this.logger.info("The subscriber doesn't define any route yet.", subscriber.routes);
                return;
            }

            const routeSetting = subscriber.routes[type][action];
            if (subscriber.routes[type].enable == false || !routeSetting || routeSetting.enable == false) {
                this.logger.info("The subscriber doesn't require this route.", type, action);
                return;
            }

            if (!routeSetting.http_method || !routeSetting.uri) {
                this.logger.warn("The route is not correct.", routeSetting);
                return;
            }

            const httpReq = axios[routeSetting.http_method.toLowerCase()];
            if (!httpReq) {
                this.logger.warn("The HTTP method is not valid.", routeSetting.http_method);
                return;
            }

            const data = {
                action: action,
                category: type,
                source: {
                    conversation_id: convInfo.id,
                    conversation_name: convInfo.name,
                    conversation_channel: convInfo.channel,
                    publisher: {
                        id: publisher.id,
                        user_name: publisher.userName,
                        full_name: publisher.fullName || publisher.firstName + ", " + publisher.lastName,
                        email: publisher.mail,
                        application: publisher.application == true,
                    }
                },
                payload: {
                    message_id: message.id,
                    message_body: message.body,
                    created: message.created,
                    updated: message.updated,
                    mentions: message.mentions,
                    reactions: message.reactions,
                    parent_message_ids: message.parent_message_ids,
                }
            };
            const config = {};

            // Get global settings
            if (subscriber.settings && subscriber.settings.headers) {
                config.headers = subscriber.settings.headers;
            }

            if (subscriber.settings && subscriber.settings.reject_unauthorized == false) {
                config.httpsAgent = new https.Agent({
                    rejectUnauthorized: subscriber.settings.reject_unauthorized
                });
            }

            // Merge specific settings
            if (routeSetting.headers) {
                config.headers = Object.assign(config.headers || {}, routeSetting.headers);
            }

            // Execute HTTP
            httpReq(routeSetting.uri, data, config).then((res) => {
                this.logger.debug("Successfully notify information to subscriber", subscriber.id, JSON.stringify(res.data));
            }).catch(err => {
                this.logger.warn("Could not notify information to subscriber", subscriber.id, err);
            });
        }
    },

    /**
     * Service created lifecycle event handler
     */
    created() {
        this.map = new Map();
    },

    /**
     * Service started lifecycle event handler
     */
    started() { },

    /**
     * Service stopped lifecycle event handler
     */
    stopped() { },
};

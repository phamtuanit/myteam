"use strict";
const axios = require("axios");
const https = require("https");
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
    name: "ext-notifier",
    version: 1,
    settings: {},
    dependencies: ["v1.applications", "v1.user-queue"],
    mixins: [],
    actions: {},

    /**
     * Events
     */
    events: {
        // user-queue.*
        "user-queue.*"(data, sender, event) {
            const [, act] = event.split(".");
            const { userId: appID, payload } = data;
            this.logger.debug("Receiving a message from user-queue.", appID);

            if (payload && appID) {
                this.handleMessageQueue(payload, act, appID);
            } else {
                this.logger.warn("Will not handle this message. Missing identify information.");
            }
        },
    },

    /**
     * Methods
     */
    methods: {
        async handleMessageQueue(payload, action, appID) {
            const appInfo = await this.broker.call("v1.applications.getAppById", { id: appID });
            if (!appInfo || appInfo.enable === false) {
                return;
            }

            if (!appInfo.endpoint || appInfo.endpoint.enable === false || !appInfo.endpoint.type) {
                this.logger.debug("The hook is not configured yet.", appID, appInfo.endpoint);
                return;
            }

            await this.notifyMessageToExternal(appInfo, payload, action);
        },
        async notifyViaAPI(appInfo, payload, action) {
            const endpoint = appInfo.endpoint;

            if (!endpoint.http_method || !endpoint.uri) {
                this.logger.warn("The endpoint is not correct.", endpoint);
                return;
            }

            const httpReq = axios[endpoint.http_method.toLowerCase()];
            if (!httpReq) {
                this.logger.warn("The HTTP method is not valid.", endpoint.http_method);
                return;
            }

            // Define HTTP request configuration
            const config = {};

            // Get global settings
            if (endpoint.settings && endpoint.settings.headers) {
                config.headers = endpoint.settings.headers;
            }

            if (endpoint.settings && endpoint.settings.reject_unauthorized == false) {
                config.httpsAgent = new https.Agent({
                    rejectUnauthorized: endpoint.settings.reject_unauthorized
                });
            }

            // Get message body
            const body = await this.getMessageBody(payload.payload, action);

            // Execute HTTP
            await httpReq(endpoint.uri, body, config).then(({ data: result }) => {
                this.logger.debug("Successfully notify information to external.", appInfo.name);

                if (result.feddback && endpoint.auto_resolve === true && result.feddback.status) {
                    this.resolveMessage(appInfo, payload, result);
                }
            }).catch(err => {
                this.logger.debug("Could not notify information to external.", appInfo.name, err);
            });
        },
        async notifyMessageToExternal(appInfo, payload, action) {
            // Notify
            const endpoint = appInfo.endpoint;
            switch (endpoint.type) {
                case "webhook":
                    await this.notifyViaAPI(appInfo, payload, action);
                    break;

                default:
                    break;
            }
        },
        getConversation(convId) {
            const conversationId = parseInt(convId);
            return this.broker.call("v1.conversations.getConversationByIdLocal", { id: conversationId });
        },
        async getMessageBody(message, action) {
            const convInfo = await this.getConversation(message.to.conversation);
            const publisher = await this.broker.call("v1.users.getUserById", { id: message.from.issuer, });

            // Build data
            return {
                action: action,
                category: "message",
                source: {
                    conversation_id: convInfo.id,
                    conversation_name: convInfo.name,
                    conversation_channel: convInfo.channel,
                    publisher: {
                        id: publisher.id,
                        user_name: publisher.userName,
                        full_name: publisher.fullName || publisher.firstName + ", " + publisher.lastName,
                        email: publisher.mail,
                        application: publisher.application === true,
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
        },
        async cleanMessageQueue(appInfo, lastMsgId) {
            if (appInfo.id) {
                await this.broker.call("v1.user-queue.cleanQueue", {
                    userId: appInfo.id,
                    lastId: lastMsgId,
                },
                    {
                        meta: {
                            user: appInfo
                        }
                    })
                    .catch((error) => {
                        this.logger.error("Could not clean message-queue.", appInfo, error && error.message);
                    });
            }
        },
        async confirmMessagesInQueue(appInfo, lastMsgIds) {
            if (appInfo.id) {
                lastMsgIds = lastMsgIds.map(id => ("" + id));
                await this.broker.call("v1.user-queue.confirmMessage", {
                        userId: appInfo.id,
                        ids: lastMsgIds,
                    },
                    {
                        meta: {
                            user: appInfo
                        }
                    })
                    .catch((error) => {
                        this.logger.error("Could not confirm these messages.", appInfo, error && error.message);
                    });
            }
        },
        async resolveMessage(appInfo, payload, result) {
            if (result.feddback.status == "resolved" && result.feddback.action) {
                this.logger.debug("User had resolved the message.", result.feddback);

                // External resolved the message.
                switch (result.feddback.action) {
                    case "confirm":
                        return this.confirmMessagesInQueue(appInfo, [payload.id]);
                    case "confirm_before":
                        return this.cleanMessageQueue(appInfo, payload.id);
                    case "confirm_all":
                        return this.cleanMessageQueue(appInfo);

                    default:
                        break;
                }
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

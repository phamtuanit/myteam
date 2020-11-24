"use strict"
module.exports = {
    name: "gitlab-hook",
    version: 1,
    // dependencies: ["v1.extensions.messages"],
    settings: {},
    mixins: [],
    actions: {
        webui: {
            auth: true,
            roles: [15],
            rest: "POST /webui/merge_request",
            params: {
                object_kind: { type: "string"},
                user: { type: "object" },
                repository: { type: "object" },
                object_attributes: { type: "object" },
                target: { type: "object", optional: true },
                labels: { type: "array", optional: true },
                assignees: { type: "array", optional: true },
                changes: { type: "object" },
            },
            async handler(ctx) {
                if (ctx.params.assignees) {
                    const mergeStatus = ctx.params.object_attributes.merge_status.replace(/_/g, " ");
                    const creatorName = ctx.params.user.name;
                    const { title, state, url } = ctx.params.object_attributes;
                    const toBranch = ctx.params.object_attributes.target_branch;
                    const fromBranch = ctx.params.object_attributes.source_branch;

                    const messageContent =
                            `<div>
                                <span class="mention">@${creatorName}</span><span> have just ${state} a merge request.</span><br>
                                <strong>🔔 ${title}</strong><br>
                                <span>📌 ${fromBranch}  →  ${toBranch}</span><br>
                                <span>⚡ Action: <code>${state.toUpperCase()}</code></span><br>
                                <span>📢 Status: <code>${mergeStatus.toUpperCase()}</code></span><br>
                                <span>🔗 <a target="_blank" rel="noopener noreferrer" href="${url}">View detail</a></span>
                            </div>`;

                    const destinations = ctx.params.assignees.map(u => u.username);
                    destinations.forEach((reviewer) => {
                        ctx.call("v1.extensions.messages.postMessages", {
                            conversation_id: 1588579604801,
                            user_id: reviewer.replace(/\./g, "-"),
                            body: { content: messageContent },
                        }).catch(this.logger.error);
                    });
                }
            },
        },
    },

    /**
     * Events
     */
    events: { },

    /**
     * Methods
     */
    methods: {

    },

    /**
     * Service created lifecycle event handler
     */
    created() {},

    /**
     * Service started lifecycle event handler
     */
    started() { },

    /**
     * Service stopped lifecycle event handler
     */
    stopped() {},
};
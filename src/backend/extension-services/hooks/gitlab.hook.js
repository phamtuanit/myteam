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
                this.logger.debug("Params object_attributes >>,", JSON.stringify(ctx.params.object_attributes));
                if (ctx.params.object_attributes.action == "update") {
                    // User just pushed code
                    this.logger.debug("User just pushed code or update MR.");
                    return;
                }

                const mergeStatus = ctx.params.object_attributes.merge_status.replace(/_/g, " ");
                const user = ctx.params.user;
                const { title, url, iid, action, state } = ctx.params.object_attributes;
                const toBranch = ctx.params.object_attributes.target_branch;
                const fromBranch = ctx.params.object_attributes.source_branch;
                let destinations = [];
                if (ctx.params.assignees && ctx.params.assignees.length > 0) {
                    destinations = ctx.params.assignees.map(u => ({ id: u.username.replace(/\./g, "-"), name: u.name }));
                }

                // Correct user name
                user.username = user.username.replace(/\./g, "-");
                const mentionStr = `<span class="mention user-mention" data-mention="@${user.username}" data-user-id="${user.username}">@${user.name}</span>`;
                let assigneesStr = "";
                if (destinations.length > 0) {
                    assigneesStr = destinations.map(u => {
                        return `<span class="mention user-mention" data-mention="@${u.id}" data-user-id="${u.id}">@${u.name}</span>`;
                    }).join(", ");
                    assigneesStr = `<span>🙍‍♂️ Assignees: ${assigneesStr}</span><br>`;
                }
                let messageContent =
                        `<div>
                            ${mentionStr}<span> just ${state} a merge request #${iid}.</span><br>
                            <strong>🔔 ${title}</strong><br>
                            <span>🗺️ Branch: ${fromBranch}  ⇒  ${toBranch}</span><br>
                            <span>⚡ Action: <code>${action.toUpperCase()}</code></span><br>
                            <span>📌 Status: <code>${mergeStatus.toUpperCase()}</code></span><br>
                            ${assigneesStr}
                            <span>🔗 <a target="_blank" rel="noopener noreferrer" href="${url}">View detail</a></span>
                        </div>`;
                // Minify message content
                messageContent = messageContent.split("\n").map(ln => ln.trim()).join("");

                // Post a message to Application channel
                let generalChannel = 1588579604801; // Application
                if (toBranch.includes("IT6_2.2")) {
                    generalChannel = 1605770299913; // IT6_2.2
                }
                ctx.call("v1.extensions.messages.postMessages", {
                    conversation_id: generalChannel,
                    body: { content: messageContent },
                })
                .catch(this.logger.error)
                    .then(() => {
                    this.logger.info("Post a message to", generalChannel);
                    // Post a message to reviewers
                    if (destinations.length > 0) {
                        destinations.forEach((reviewer) => {
                            if (user.username == reviewer.id) {
                                return; // Don't notify to operator
                            }

                            ctx.call("v1.extensions.messages.postMessages", {
                                user_id: reviewer.id.replace(/\./g, "-"),
                                body: { content: messageContent },
                            }).catch(this.logger.error);
                        });
                    }
                });
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
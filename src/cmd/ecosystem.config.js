module.exports = {
    apps: [
        {
            name: "myteam-user-svr",
            cwd: "../backend",
            script: "./node_modules/moleculer/bin/moleculer-runner.js",
            args: ["services/user.*"],
            out_file: "../logs/myteam-user.logs",
            error_file: "../logs/myteam-user.error.logs",
        },
        {
            name: "myteam-authentication-svr",
            cwd: "../backend",
            script: "./node_modules/moleculer/bin/moleculer-runner.js",
            args: ["services/authentication.*"],
            out_file: "../logs/myteam-authentication.logs",
            error_file: "../logs/myteam-authentication.error.logs",
        },
        {
            name: "myteam-authorization-svr",
            cwd: "../backend",
            script: "./node_modules/moleculer/bin/moleculer-runner.js",
            args: ["services/authorization.*"],
            out_file: "../logs/myteam-authorization.logs",
            error_file: "../logs/myteam-authorization.error.logs",
        },
        {
            name: "myteam-live-svr",
            cwd: "../backend",
            script: "./node_modules/moleculer/bin/moleculer-runner.js",
            args: ["services/live.*"],
            out_file: "../logs/myteam-live.logs",
            error_file: "../logs/myteam-live.error.logs",
        },
        {
            name: "myteam-user-queue-svr",
            cwd: "../backend",
            script: "./node_modules/moleculer/bin/moleculer-runner.js",
            args: ["services/message-queue.*"],
            out_file: "../logs/myteam-message-queue.logs",
            error_file: "../logs/myteam-message-queue.error.logs",
        },
        {
            name: "myteam-conversation-svr",
            cwd: "../backend",
            script: "./node_modules/moleculer/bin/moleculer-runner.js",
            args: ["services/conversation.*"],
            out_file: "../logs/myteam-conversation.logs",
            error_file: "../logs/myteam-conversation.error.logs",
        },
        {
            name: "myteam-message-svr",
            cwd: "../backend",
            script: "./node_modules/moleculer/bin/moleculer-runner.js",
            args: ["services/message.*"],
            out_file: "../logs/myteam-messages.logs",
            error_file: "../logs/myteam-messages.error.logs",
        },
        {
            name: "myteam-elasticsearch-svr",
            cwd: "../backend",
            script: "./node_modules/moleculer/bin/moleculer-runner.js",
            args: ["services/elasticsearch.*"],
            out_file: "../logs/myteam-elasticsearch.logs",
            error_file: "../logs/myteam-elasticsearch.error.logs",
        },
        {
            name: "myteam-attachment-svr",
            cwd: "../backend",
            script: "./node_modules/moleculer/bin/moleculer-runner.js",
            args: ["services/attachment.*"],
            out_file: "../logs/myteam-attachment.logs",
            error_file: "../logs/myteam-attachment.error.logs",
        },
        {
            name: "myteam-gateway",
            cwd: "../backend",
            script: "./node_modules/moleculer/bin/moleculer-runner.js",
            args: ["services/*.gateway.js"],
            out_file: "../logs/myteam-gateway.logs",
            error_file: "../logs/myteam-gateway.error.logs",
        },
    ],
};
module.exports = {
    apps: [
        {
            name: "myteam-services",
            cwd: "./backend",
            script: "./node_modules/moleculer/bin/moleculer-runner.js",
            args: ["--instances=2", "services/*.service.js"],
            out_file: "../logs/myteam-services.logs",
            error_file: "../logs/myteam-services.error.logs",
        },
        {
            name: "myteam-gateway",
            cwd: "./backend",
            script: "./node_modules/moleculer/bin/moleculer-runner.js",
            args: ["services/*.gateway.js"],
            out_file: "../logs/myteam-gateway.logs",
            error_file: "../logs/myteam-gateway.error.logs",
        },
    ],
};

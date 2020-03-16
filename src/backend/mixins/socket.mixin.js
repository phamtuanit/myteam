const ApiGateway = require("moleculer-web");
const io = require("socket.io");
module.exports = {
    name: "socket",

    methods: {
        onConnected(socket) {
            let token = socket.handshake.query.token;
            this.broker
                .call("v1.auth.verifyToken", { token })
                .then(user => {
                    socket.handshake.user = user;
                    this.logger.info(`User ${user.id} has been connected.`);
                    this.handleNewUser(socket, user);
                })
                .catch(err => {
                    this.logger.warn("Incoming socket don't has valid access token. Disconnecting...", err.message);
                    socket.disconnect();
                });
        },
        handleNewUser(socket, user) {
            const connectedEvt = `${this.broker.nodeID}.user.connected`;
            this.broker.emit(connectedEvt, user);

            socket.on("disconnect", () => {
                this.logger.info(`User ${user.id} has been disconnected.`);
                const disconnectedEvt = `${this.broker.nodeID}.user.disconnected`;
                this.broker.emit(disconnectedEvt, user);
            });
        }
    },

    created() {
        if (!this.server) {
            this.logger.error("[server] is required for Socket-IO.");
            return;
        }
        this.io = io(this.server, { path: this.settings.io.path || "chat-io" });
        this.io.on("connection", this.onConnected);
    },

    stopped() {
        if (this.io) {
            this.io.close();
        }
    }
};

const Subscriber = require("../services/message-subscriber/redis.subscriber.js");
const io = require("socket.io");
module.exports = {
    name: "socket",

    settings: {
        // port: 3000,
        server: true,
        io: {
            path: "chat-io"
        }
    },

    /**
     * Events
     */
    events: {
        // [NodeID].user.status
        "*.user.status"(data) {
            const userId = data.user ? data.user.id : undefined;

            if (typeof userId == "string") {
                this.logger.debug(
                    `Status of user ${userId} has been change.`,
                    data
                );
                // Broadcast to all user
                Object.keys(this.sockets).forEach(key => {
                    if (userId != key) {
                        const socket = this.sockets[key];
                        socket.send("user.status", data);
                    }
                });
            }
        }
    },

    methods: {
        onConnected(socket) {
            let token = socket.handshake.query.token;
            this.broker
                .call("v1.auth.verifyToken", { token })
                .then(user => {
                    this.handleNewSocket(socket, user);
                })
                .catch(err => {
                    this.logger.warn(
                        "Incoming socket don't has valid access token. Disconnecting...",
                        err.message
                    );
                    socket.disconnect();
                });
        },
        handleNewSocket(socket, user) {
            socket.handshake.user = user;
            this.sockets[user.id] = socket;
            this.logger.info(`User ${user.id} has been connected.`);

            const connectedEvt = `${this.broker.nodeID}.user.connected`;
            this.broker.emit(connectedEvt, user, ["live"]); // live service only

            socket.on("disconnect", () => {
                this.logger.info(`User ${user.id} has been disconnected.`);
                const disconnectedEvt = `${this.broker.nodeID}.user.disconnected`;
                this.broker.emit(disconnectedEvt, user, ["live"]);
            });

            socket.on("join", room => {
                socket.join(room);
            });

            socket.on("leave", room => {
                socket.leave(room);
            });
        },
        onReceivedMessage(channel, message) {
            const [resource, objectId, action] = channel.split(".");
            const data = {
                channel,
                payload: message
            };
            switch (resource) {
                case "message":
                    {
                        const socket = this.sockets[objectId];
                        if (socket) {
                            socket.send(action, data);
                        }
                    }
                    break;

                default:
                    this.io.to("live").emit("live", action, data);
                    break;
            }
        }
    },

    created() {
        // Init redis-bus
        this.subscriber = new Subscriber("message@socket", this.logger);
        this.subscriber.on("message", this.onReceivedMessage);
        const syncTask = this.subscriber.connect("*.*.*").catch(err => {
            this.logger.error("Cannot connect to redis.", err);
        });

        // Init Socket
        this.sockets = {};
        return syncTask.then(() => {
            if (!this.server) {
                this.logger.error("[server] is required for Socket-IO.");
                return;
            }
            this.io = io(this.server, {
                path: this.settings.io.path || "chat-io"
            });
            this.io.on("connection", this.onConnected);
        });
    },

    stopped() {
        if (this.io) {
            this.io.close();
        }
    }
};

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
            const status = data.status;

            if (typeof userId == "string") {
                this.logger.debug(
                    `Status of user ${userId} has been change.`,
                    data
                );

                const socketDict = this.sockets[userId];
                // Broadcast to all user
                if (status == "on") {
                    if (Object.keys(socketDict).length == 1) {
                        const socket = Object.values(socketDict)[0];
                        socket.to("live").emit("live", status, data);
                    }
                } else if (!socketDict || Object.keys(socketDict).length <= 0) {
                    this.io.to("live").emit("live", status, data);
                }
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
            const requiredRooms = [user.id, "live"];
            // Save socket
            this.sockets[user.id] = this.sockets[user.id] || {};
            this.sockets[user.id][socket.id] = socket;
            this.logger.info(`User ${user.id} has been connected.`);

            // Join to required room
            requiredRooms.forEach(room => {
                socket.join(room);
            });

            // Broadcast to the others about new user
            const connectedEvt = `${this.broker.nodeID}.user.connected`;
            this.broker.emit(connectedEvt, user, ["live"]); // live service only

            socket.on("disconnect", () => {
                this.logger.info(`User ${user.id} has been disconnected.`);

                // Leave to required room
                requiredRooms.forEach(room => {
                    socket.leave(room);
                });

                // Clear socket storage
                const socketDict = this.sockets[user.id];
                const existingSocket = socketDict[socket.id];
                if (existingSocket) {
                    delete socketDict[socket.id];
                }

                if (Object.keys(socketDict).length <= 0) {
                    delete this.sockets[user.id];
                }

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
            const socketDict = this.sockets[objectId];
            if (socketDict && Object.keys(socketDict).length > 0) {
                const data = {
                    channel,
                    payload: message
                };
                // To private user room
                this.io.to(objectId).emit(resource, action, data);
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

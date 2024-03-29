const io = require("socket.io");
module.exports = {
    name: "socket",

    settings: {
        version: 3,
        server: true,
        io: {
            path: "/chat-io",
            secure: true,
        },
    },

    /**
     * Events
     */
    events: {
        // user.[userId].status.*
        "user.*.status.*"(data, sender, event) {
            const userId = data.user ? data.user.id : undefined;
            const status = data.status;
            data.event = event;

            this.logger.info(
                `WS >>> Status of user [${userId}] has been changed to`,
                status
            );

            this.logger.debug("WS >>> Broadcast message to all of user.");
            this.io.to("live").emit("live", status, data, event);
        },
        // user-queue.*
        "user-queue.*"(data, sender, event) {
            const [, act] = event.split(".");
            const { userId, payload: message } = data;
            this.logger.info(
                "WS >>> Receiving a message from user-queue.",
                userId,
                event
            );
            const socketDict = this.sockets[userId];
            if (socketDict && Object.keys(socketDict).length > 0) {
                message.event = event;
                // To private user room
                this.io.to(userId).emit(message.type || "message", act, message, event);
            }
        },
    },

    methods: {
        onConnected(socket) {
            let token = socket.handshake.query.token;
            let clientVersion = socket.handshake.query.version;
            this.broker
                .call("v1.auth.verifyToken", { token })
                .then((user) => {
                    socket.handshake.user = user;
                    this.handleNewSocket(socket);
                })
                .then(() => {
                    const serverVer = this.settings.version;
                    if (!clientVersion || parseInt(clientVersion) < serverVer) {
                        setTimeout(() => {
                            socket.emit("system", "incompatible", serverVer);
                        }, 1000);
                    }
                })
                .catch((err) => {
                    this.logger.warn(
                        "WS >>> Incoming socket don't has valid access-token. Disconnecting...",
                        err.message
                    );
                    socket.emit("unauthenticated");
                    setTimeout(socket.disconnect, 100);
                });
        },
        handleNewSocket(socket) {
            const user = socket.handshake.user;
            const requiredRooms = [user.id, "live"];
            // Save socket
            this.sockets[user.id] = this.sockets[user.id] || {};
            this.sockets[user.id][socket.id] = socket;
            this.logger.info(
                `WS >>> User [${user.id}] has been connected via WebSocket.`
            );

            // Join to required room
            requiredRooms.forEach((room) => {
                socket.join(room);
            });

            // Broadcast to the others about new user
            const connectedEvt = `user.${user.id}.socket.connected`;
            this.broker.broadcast(connectedEvt, user, ["live"]); // live service only

            socket.on("confirm", (data) => {
                return this.onSocketConfirmed(socket, data);
            });

            socket.on("disconnect", () => {
                this.logger.info(
                    `WS >>> User ${user.id} has been disconnected.`
                );

                // Leave to required room
                requiredRooms.forEach((room) => {
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

                const disconnectedEvt = `user.${user.id}.socket.disconnected`;
                this.broker.broadcast(disconnectedEvt, user, ["live"]);
            });

            socket.on("join", (room) => {
                socket.join(room);
            });

            socket.on("leave", (room) => {
                socket.leave(room);
            });
        },
        onSocketConfirmed(socket, data) {
            if (data.status == "confirmed") {
                if (data.type == "message" && data.action) {
                    this.cleanMessageQueue(socket, data);
                    return;
                }
            }
        },
        cleanMessageQueue(socket, info) {
            if (!info || !socket || !socket.handshake.user) {
                return;
            }

            const userId = socket.handshake.user.id;
            if (userId) {
                this.broker
                    .call("v1.user-queue.cleanQueue", { userId, lastId: info.id })
                    .catch((error) => {
                        this.logger.error(
                            "Could not clean message-queue.",
                            userId,
                            error
                        );
                    });
            }
        },
    },

    created() {
        // Init Socket
        this.sockets = {};
        if (!this.server) {
            this.logger.error("WS >>> Server is required for Socket-IO.");
            return;
        }
        this.io = io(this.server, this.settings.io);
        this.io.on("connection", this.onConnected);
    },

    stopped() {
        if (this.io) {
            this.logger.info("WS >>> Broadcast live status to all WS client.");
            this.io.to("live").emit("live", "broadcast", { status: "off" });
            this.io.close();
        }
    },
};

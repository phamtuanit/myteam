const io = require("socket.io");
module.exports = {
    name: "socket",

    settings: {
        // port: 3000,
        server: true,
        io: {
            path: "chat-io",
        },
    },

    /**
     * Events
     */
    events: {
        // user.[userId].status.*
        "user.*.status.*"(data, sender, event, ctx) {
            const userId = data.user ? data.user.id : undefined;
            const status = data.status;
            data.event = event;

            this.logger.info(
                `WS >>> Status of user [${userId}] has been changed to`, status
            );

            this.logger.debug("WS >>> Broadcast mesaage to all of user")
            this.io.to("live").emit("live", status, data, event);
        },
        // message-queue.[userId].message.*
        "message-queue.*.message.*"(message, sender, event, ctx) {
            const [, userId, resource, act] = event.split(".");
            this.logger.info("WS >>> Receiving a message from user-queue.", userId, event);
            const socketDict = this.sockets[userId];
            if (socketDict && Object.keys(socketDict).length > 0) {
                message.event = event;
                // To private user room
                this.io.to(userId).emit(message.type || resource, act, message, event);
            }
        },
        // conversation.[conversation].message.rejected.[create]
        // "conversation.*.message.rejected.*"(message, sender, event, ctx) {
        //     const [, , resource, act] = event.split(".");
        //     const fromUser = message.payload.from.issuer;

        //     const socketDict = this.sockets[fromUser];
        //     if (socketDict && Object.keys(socketDict).length > 0) {
        //         message.error = message.error
        //             ? message.error.message
        //             : "Server unknown error";
        //         // To private user room
        //         this.io.to(fromUser).emit(resource, act, message, event);
        //     }
        // },
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
                        "WS >>> Incoming socket don't has valid access-token. Disconnecting...",
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
            this.logger.info(`WS >>> User [${user.id}] has been connected via WebSocket.`);

            // Join to required room
            requiredRooms.forEach(room => {
                socket.join(room);
            });

            // Broadcast to the others about new user
            const connectedEvt = `user.${user.id}.socket.connected`;
            this.broker.broadcast(connectedEvt, user, ["live"]); // live service only

            socket.on("confirm", data => {
                return this.onSocketConfirmed(socket, data);
            });

            socket.on("disconnect", () => {
                this.logger.info(`WS >>> User ${user.id} has been disconnected.`);

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

                const disconnectedEvt = `user.${user.id}.socket.disconnected`;
                this.broker.broadcast(disconnectedEvt, user, ["live"]);
            });

            socket.on("join", room => {
                socket.join(room);
            });

            socket.on("leave", room => {
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
                const event = `message-queue.${userId}.message.confirmed`;
                this.broker.broadcast(event, info, ["messages-queue"]);
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
        this.io = io(this.server, {
            path: this.settings.io.path || "chat-io",
        });
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

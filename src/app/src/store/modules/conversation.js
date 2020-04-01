const messageService = new (require("../../services/message.service").default)();
const convService = new (require("../../services/conversation.service").default)();
const messageQueueSvr = new (require("../../services/message-queue.service.js").default)();
let eventBus = null;

function pushInformation(count) {
    if (count <= 0) {
        return;
    }
    const payload = {
        sender: "app-chat",
        inform: {
            count: count,
        },
    };
    eventBus.emit("drawer.inform", payload);
}

function informNewMessage(message) {
    if (message._isMe == true) {
        return;
    }

    pushInformation(1);
}

const moduleState = {
    namespaced: true,
    state: {
        chat: {
            active: null,
            all: [],
        },
        channel: {
            active: null,
            all: [],
        },
        moduleState: "startup",
    },
    mutations: {
        setModuleState(state, moduleState) {
            state.moduleState = moduleState;
        },
        setAll(state, chat) {
            if (chat) {
                chat.forEach(conv => {
                    if (conv.channel == true) {
                        state.channel.all.push(conv);
                    } else {
                        state.chat.all.push(conv);
                    }
                });
            }
        },
        setActivate(state, conv) {
            if (!conv) {
                return;
            }

            const currentConv =
                conv.channel == true
                    ? state.channel.active
                    : state.chat.active;
            if ( currentConv && (currentConv.id == conv.id || (currentConv._id && currentConv._id == conv._id))
            ) {
                return;
            }

            if (conv.channel == true) {
                state.channel.active = conv;
            } else {
                state.chat.active = conv;
            }
        },
        addChat(state, conv) {
            if (!conv.messages) {
                conv.messages = [];
            }

            if (!conv.meta) {
                conv.meta = {
                    unreadMessage: [],
                };
            }

            // Update conversation name
            if (!conv.name) {
                const friends = conv.subscribers.filter(user => !user._isMe);
                if (friends.length > 0) {
                    conv.name = friends[0].fullName;
                }
            }

            if (conv.channel == true) {
                state.channel.all.push(conv);
            } else {
                state.chat.all.push(conv);
            }
        },
        removeChat(state, convId) {
            const convList = [state.channel.all, state.chat.all];
            convList.forEach(all => {
                const index = all.findIndex(i => i.id == convId);
                if (index >= 0) {
                    all.splice(index, 1);
                    return;
                }
            });
        },
        addMessage(state, { convId, message }) {
            if (!message || typeof convId != "number") {
                return;
            }

            message.status = null;
            // Incase has chat in cache
            if (message.from && message.from.issuer) {
                const me = this.state.users.me;
                message._isMe = message.from.issuer == me.id;
            }

            const conv = state.channel.all
                .concat(state.chat.all)
                .find(c => c.id == convId);
            if (conv) {
                const pushToUnread = function(message) {
                    if (!message._isMe) {
                        conv.meta.unreadMessage.push(message);
                    }
                };

                if (!conv.messages) {
                    conv.messages = [message];
                    pushToUnread(message);
                    informNewMessage(message);
                } else {
                    const foundMessage = conv.messages.find(
                        i => i.id == message.id
                    );
                    if (!foundMessage) {
                        conv.messages.push(message);
                        pushToUnread(message);
                        informNewMessage(message);
                    } else {
                        Object.assign(foundMessage, message);
                    }
                }
            }
        },
        removeMessage(state, { convId, message }) {
            const conv = state.channel.all
                .concat(state.chat.all)
                .find(c => c.id == convId);
            if (conv) {
                const existingMsg = conv.messages.find(i => i.id == message.id);
                if (existingMsg) {
                    existingMsg.status = "removed";

                    const me = this.state.users.me;
                    if (me.id != existingMsg.from.issuer) {
                        existingMsg.body.content =
                            "It has been removed by author";
                    }
                }
            }
        },
        updateMessage(state, { convId, message }) {
            const conv = state.channel.all
                .concat(state.chat.all)
                .find(c => c.id == convId);
            if (conv) {
                const existingMsg = conv.messages.find(i => i.id == message.id);
                if (existingMsg) {
                    Object.assign(existingMsg.body, message.body);
                }
            }
        },
        rejectedMessage(state, { action: preAct, payload: message, error }) {
            const convId = message.to.conversation;
            if (typeof convId != "number") {
                console.warn(
                    "Could not detect conversation id. Ignore this information."
                );
                return;
            }

            // Find conversation
            const conv = state.channel.all
                .concat(state.chat.all)
                .find(c => c.id == convId);
            if (!conv) {
                console.warn(
                    "Could not find existing chat. Ignore this information."
                );
                return;
            }

            const existingMsg = conv.messages.find(i => i.id == message.id);
            if (!existingMsg) {
                console.info(
                    "Could not find existing message. Ignore this information."
                );
                return;
            }

            existingMsg.status = preAct + "-rejected";
            existingMsg.error = "The message could not be sent!";
            console.info("A message was rejected.", error);
        },
        watchAllMessage(state, convId) {
            // Find conversation
            const conv = state.channel.all
                .concat(state.chat.all)
                .find(c => c.id == convId);
            if (conv && conv.messages && conv.messages.length > 0) {
                conv.meta.unreadMessage.splice(0);
                return conv;
            }
        },
    },
    actions: {
        async initialize(ctx) {
            eventBus = window.IoC.get("bus");

            // Setup Socket
            await this.dispatch("conversations/setupSocket");

            const { commit, rootState } = ctx;
            const me = rootState.users.me;
            const res = await convService.getByUser(me.id);
            const convList = res.data;

            if (convList) {
                for (let index = 0; index < convList.length; index++) {
                    const conv = convList[index];
                    if (conv.subscribers && conv.subscribers.length > 0) {
                        // Get user info
                        const users = await this.dispatch(
                            "users/resolve",
                            conv.subscribers
                        );
                        conv.subscribers = users;

                        // Update conversation name
                        if (!conv.name) {
                            const friends = conv.subscribers.filter(
                                user => !user._isMe
                            );
                            if (friends.length > 0) {
                                conv.name = friends[0].fullName;
                            }
                        }
                    }
                }
            }

            commit("setAll", convList);

            // Get message history from server after configured socket
            if (convList) {
                for (let index = 0; index < convList.length; index++) {
                    const conv = convList[index];

                    // Load conversation content
                    const content = await this.dispatch(
                        "conversations/getConversationContent",
                        conv.id
                    );
                    conv.meta = {
                        unreadMessage: [],
                    };
                    conv.messages = content || [];

                    // Update message info
                    conv.messages.forEach(msg => {
                        if (msg.from && msg.from.issuer == me.id) {
                            msg._isMe = true;
                        }
                    });
                }

                // Process message in queue
                const messageQueue = rootState.messageQueue;
                const confirmedMsqIds = [];
                messageQueue.forEach(message => {
                    if (message.type !== "message") {
                        return;
                    }

                    const convId = message.payload.to.conversation;
                    const msgId = message.payload.id;
                    switch (message.action) {
                        case "created":
                            {
                                const conv = convList.find(c => c.id == convId);
                                if (conv) {
                                    const existingMsg = conv.messages.find(
                                        m => m.id == msgId
                                    );
                                    if (existingMsg) {
                                        conv.meta.unreadMessage.push(
                                            existingMsg
                                        );
                                    } else {
                                        confirmedMsqIds.push(message.id);
                                    }
                                } else {
                                    confirmedMsqIds.push(message.id);
                                }
                            }
                            break;

                        default:
                            confirmedMsqIds.push(message.id);
                            break;
                    }
                });

                if (confirmedMsqIds.length > 0) {
                    await messageQueueSvr.confirm(me.id, confirmedMsqIds);
                }
            }

            commit("setModuleState", "initialized");
        },
        async createConversation({ commit, state }, convInfo) {
            const invalid = !convInfo || !convInfo.subscribers || convInfo.subscribers.length <= 0;
            if (invalid) {
                console.warn("The input data is invalid");
                return;
            }

            if (convInfo.channel === undefined) {
                convInfo.channel = false;
            }

            const me = this.state.users.me;
            convInfo.subscribers.push(me.id);

            const lastId = convInfo.id || convInfo._id;

            // Create new conversation
            const newConv = (await convService.create(convInfo)).data;

            // Get subscribers info
            const subscribers = await this.dispatch(
                "users/resolve",
                convInfo.subscribers
            );
            newConv.subscribers = subscribers;

            if (lastId != null) {
                let conv = state.channel.all
                    .concat(state.chat.all)
                    .find(i => (i.id || i._id) == lastId);
                Object.assign(conv, newConv);
                delete conv._isTemp;
                delete conv._id;
            } else {
                commit("setActivate", newConv);
                commit("addChat", newConv);
            }

            return newConv;
        },
        async activeTmpChat({ commit }, userInfo) {
            const me = this.state.users.me;
            const convInfo = {
                id: null,
                channel: false,
                subscribers: [userInfo, me],
                messages: [],
                _id: new Date().getTime(),
                _isTemp: true,
            };
            commit("addChat", convInfo);
            commit("setActivate", convInfo);
            return convInfo;
        },
        activeChat({ commit, state }, convId) {
            const conv = state.channel.all
                .concat(state.chat.all)
                .find(c => (c.id || c._id) == convId);
            if (conv) {
                commit("setActivate", conv);
                return conv;
            }
        },
        async loadChat({ commit }, convId) {
            const conv = (await convService.getAllById(convId)).data;
            if (conv) {
                const subscribers = await this.dispatch(
                    "users/resolve",
                    conv.subscribers
                );
                conv.subscribers = subscribers || [];

                commit("addChat", conv);
                return conv;
            }
        },
        async sendMessage({ commit, state }, { convId, body }) {
            if (!convId) {
                console.warn("convId is required.");
                return;
            }

            let conv = state.channel.all
                .concat(state.chat.all)
                .find(i => (i.id || i._id) == convId);
            if (!conv) {
                console.warn("The conversation doesn't exist");
                return;
            }
            // if (conv._isTemp == true) {
            //     // Create conversation first
            //     const user = conv.subscribers[0];
            //     const me = this.state.users.me;

            //     const convInfo = {
            //         channel: false,
            //         subscribers: [me.id, user.id],
            //     };
            //     const newConv = (await convService.create(convInfo)).data;
            //     newConv.subscribers = [me, user];
            //     delete conv._isTemp;
            //     delete conv._id;
            //     Object.assign(conv, newConv);
            // }

            return await messageService.create(conv.id, body).then(res => {
                const payload = {
                    convId: conv.id,
                    message: res.data,
                };
                commit("addMessage", payload);
                // commit("setActivate", chat);
                return res.data;
            });
        },
        async deleteMessage({ commit }, message) {
            const convId = message.to.conversation;
            const msg = await messageService
                .delete(convId, message.id)
                .then(res => {
                    return res.data;
                });

            if (msg && msg.id) {
                commit("removeMessage", { convId, message });
                return msg.id;
            }
        },
        getConversationContent(ctx, convId) {
            if (typeof convId == "number") {
                return messageService.get(parseInt(convId)).then(res => {
                    return res.data;
                });
            }
            return Promise.reject("No conversation id");
        },
        setupSocket({ commit, state }) {
            const socket = window.IoC.get("socket");
            socket.on("message", (act, data) => {
                const message = data.payload;
                const convId = message.to.conversation;
                const me = this.state.users.me;

                // Send confirm message
                const confirmMsg = function confirm() {
                    socket.emit("confirm", {
                        status: "confirmed",
                        id: data.id,
                        type: data.type,
                        action: act,
                        payload: {
                            id: message.id,
                            from: message.from,
                            to: message.to,
                        },
                    });
                };

                // Handle event
                switch (act) {
                    case "created":
                        if (!data.payload || !data.payload) {
                            break;
                        } else {
                            const existingConv = state.all.find(conv => {
                                if (conv.id == convId) {
                                    return true;
                                }

                                if (conv.channel == false) {
                                    if (
                                        conv.subscribers &&
                                        conv.subscribers.length == 2
                                    ) {
                                        const matchedSub = conv.subscribers.filter(
                                            sub => {
                                                return (
                                                    sub.id == me.id ||
                                                    sub.id == message.from.issuer
                                                );
                                            }
                                        );

                                        return matchedSub.length == 2;
                                    }
                                }
                                return false;
                            });

                            // Change temp conversation to rea;
                            if (existingConv && existingConv._isTemp == true) {
                                existingConv.id = convId;
                                delete existingConv._id;
                                delete existingConv._isTemp;
                            }

                            if (existingConv) {
                                commit("addMessage", {
                                    convId: existingConv.id,
                                    message,
                                });
                            } else {
                                // Incase no chat in cache.
                                this.dispatch("conversations/loadChat", convId)
                                    .then(chat => {
                                        if (chat) {
                                            commit("addMessage", {
                                                convId,
                                                message,
                                            });
                                        }
                                    })
                                    .catch(console.error);
                            }
                        }
                        break;
                    case "reacted":
                    case "updated":
                        commit("updateMessage", { convId, message });
                        confirmMsg();
                        break;
                    case "removed":
                        commit("removeMessage", { convId, message });
                        confirmMsg();
                        break;

                    default:
                        console.warn("Unsupported message.", data);
                        break;
                }
            });
        },
        async reactMessage({ commit, state }, { type, message, status }) {
            const convId = message.to.conversation;
            const me = this.state.users.me;

            const conv = state.channel.all
                .concat(state.chat.all)
                .find(c => c.id == convId);
            if (conv) {
                if (message.reactions == undefined) {
                    message.reactions = [];
                } else {
                    const lastReaction = message.reactions.find(
                        r => r.user == me.id
                    );
                    if (status == false) {
                        if (!lastReaction) {
                            // Incase user has never reacted
                            return;
                        }
                    } else {
                        if (lastReaction && lastReaction.type == type) {
                            // Incase user has reacted
                            return;
                        }
                    }
                }

                return await messageService
                    .react(convId, message.id, type, status)
                    .then(res => {
                        return res.data;
                    })
                    .then(newMsg => {
                        commit("updateMessage", {
                            convId,
                            message: {
                                id: message.id,
                                reactions: newMsg.reactions,
                            },
                        });
                    });
            } else {
                console.warn(
                    "Could not find existing chat. Ignore this information."
                );
            }
            return;
        },
        async watchAllMessage({ commit, state, rootState }, convId) {
            const conv = state.channel.all
                .concat(state.chat.all)
                .find(c => c.id == convId);
            if (conv && conv.meta.unreadMessage.length > 0) {
                const me = rootState.users.me;
                const msgIds = conv.meta.unreadMessage.map(m => m.id);
                // Send request to server to delete unread-message
                const deletedCount = await messageQueueSvr.confirmPayload(
                    me.id,
                    msgIds
                );

                commit("watchAllMessage", convId);
                return deletedCount;
            }
        },
    },
};

module.exports = moduleState;

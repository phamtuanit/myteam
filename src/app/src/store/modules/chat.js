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
        all: [],
        active: null,
        moduleState: "startup",
    },
    mutations: {
        setModuleState(state, moduleState) {
            state.moduleState = moduleState;
        },
        setAll(state, chat) {
            state.all = chat;
        },
        setActivate(state, conv) {
            if (!conv) {
                return;
            }
            state.active = conv;
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

            state.all.push(conv);
        },
        removeChat(state, convId) {
            const index = state.all.findIndex(i => i.id == convId);
            if (index >= 0) {
                state.all.splice(index, 1);
            }
        },
        addMessage(state, { chatId, message }) {
            if (!message || typeof chatId != "number") {
                return;
            }
            const conv = state.all.find(c => c.id == chatId);
            if (conv) {
                message.status = null;

                // Incase has chat in cache
                if (message.from && message.from.issuer) {
                    const me = this.state.users.me;
                    message._isMe = message.from.issuer == me.id;
                }

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
        removeMessage(state, { chatId, message }) {
            const chat = state.all.find(c => c.id == chatId);
            if (chat) {
                const existingMsg = chat.messages.find(i => i.id == message.id);
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
        updateMessage(state, { chatId, message }) {
            const chat = state.all.find(c => c.id == chatId);
            if (chat) {
                const existingMsg = chat.messages.find(i => i.id == message.id);
                if (existingMsg) {
                    Object.assign(existingMsg, message);
                }
            }
        },
        rejectedMessage(state, { action: preAct, payload: message, error }) {
            const chatId = message.to.conversation;
            if (typeof chatId != "number") {
                console.warn(
                    "Could not detect chatId. Ignore this information."
                );
                return;
            }
            const chat = state.all.find(c => c.id == chatId);
            if (!chat) {
                console.warn(
                    "Could not find existing chat. Ignore this information."
                );
                return;
            }

            const existingMsg = chat.messages.find(i => i.id == message.id);
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
            const conv = state.all.find(c => c.id == convId);
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
        async createChat({ commit }, friendId) {
            const me = this.state.users.me;
            const convInfo = {
                channel: false,
                subscribers: [me.id, friendId],
            };
            const newConv = (await convService.create(convInfo)).data;
            // Get user info
            const friendInfo = await this.dispatch("users/resolve", friendId);
            newConv.subscribers = [me, friendInfo];

            commit("setActivate", newConv);
            commit("addChat", newConv);
            return newConv;
        },
        async activeTmpChat({ commit }, user) {
            const me = this.state.users.me;
            const convInfo = {
                id: null,
                channel: false,
                subscribers: [user, me],
                meta: {
                    unreadMessage: [],
                },
                messages: [],
                _id: new Date().getTime(),
                _isTemp: true,
            };
            commit("addChat", convInfo);
            commit("setActivate", convInfo);
            return convInfo;
        },
        activeChat({ commit, state }, id) {
            if (state.active && state.active.id && state.active.id == id) {
                return state.active;
            }

            const chat = state.all.find(i => (i.id || i._id) == id);
            if (chat) {
                commit("setActivate", chat);
                return chat;
            }
        },
        async loadChat({ commit }, chatId) {
            const conv = (await convService.getAllById(chatId)).data;
            if (conv) {
                const subscribers = await this.dispatch(
                    "users/resolve",
                    conv.subscribers
                );
                conv.subscribers = subscribers;

                commit("addChat", conv);
                return conv;
            }
        },
        async sendMessage({ commit, state }, { chatId, body }) {
            if (!chatId) {
                console.warn("chatId is required.");
                return;
            }

            let chat = state.all.find(i => (i.id || i._id) == chatId);
            if (chat && chat._isTemp == true) {
                // Create conversation first
                const user = chat.subscribers[0];
                const me = this.state.users.me;

                const convInfo = {
                    channel: false,
                    subscribers: [me.id, user.id],
                };
                const newConv = (await convService.create(convInfo)).data;
                newConv.subscribers = [me, user];
                delete chat._isTemp;
                delete chat._id;
                Object.assign(chat, newConv);
            }

            return await messageService.create(chat.id, body).then(res => {
                const payload = {
                    chatId: chat.id,
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
                commit("removeMessage", { chatId: convId, message });
                return msg.id;
            }
        },
        getConversationContent(ctx, chatId) {
            if (typeof chatId == "number") {
                return messageService.get(parseInt(chatId)).then(res => {
                    return res.data;
                });
            }
            return Promise.reject("No conversation id");
        },
        setupSocket({ commit, state }) {
            const socket = window.IoC.get("socket");
            socket.on("message", (act, data) => {
                const message = data.payload;
                const chatId = message.to.conversation;
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
                                if (conv.id == chatId) {
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
                                                    sub.id ==
                                                        message.from.issuer
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
                                existingConv.id = chatId;
                                delete existingConv._id;
                                delete existingConv._isTemp;
                            }

                            if (existingConv) {
                                commit("addMessage", {
                                    chatId: existingConv.id,
                                    message,
                                });
                            } else {
                                // Incase no chat in cache.
                                this.dispatch("conversations/loadChat", chatId)
                                    .then(chat => {
                                        if (chat) {
                                            commit("addMessage", {
                                                chatId,
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
                        commit("updateMessage", { chatId, message });
                        confirmMsg();
                        break;
                    case "removed":
                        commit("removeMessage", { chatId, message });
                        confirmMsg();
                        break;

                    default:
                        console.warn("Unsupported message.", data);
                        break;
                }
            });
        },
        async reactMessage({ commit, state }, { type, message, status }) {
            const chatId = message.to.conversation;
            const me = this.state.users.me;

            const chat = state.all.find(c => c.id == chatId);
            if (chat) {
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
                    .react(chatId, message.id, type, status)
                    .then(res => {
                        return res.data;
                    })
                    .then(newMsg => {
                        commit("updateMessage", {
                            chatId,
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
            const conv = state.all.find(c => c.id == convId);
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

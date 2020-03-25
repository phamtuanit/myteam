const messageService = new (require("../../services/message.service").default)();
const convService = new (require("../../services/conversation.service").default)();
let eventBus = null;

function informNewMessage() {
    const payload = {
        sender: "app-chat",
        inform: {
            count: 1,
        },
    };
    eventBus.emit("drawer.inform", payload);
}

const moduleState = {
    namespaced: true,
    getters: {
        getAllChat: state => state.all,
        getChat: state => id => state.all.find(i => i.id == id),
    },
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
        setActivate(state, chat) {
            if (!chat) {
                return;
            }

            if (!chat.messages) {
                chat.messages = [];
            }
            if (!chat.recent) {
                chat.recent = {};
            }
            state.active = chat;
        },
        addChat(state, chat) {
            if (!chat.messages) {
                chat.messages = [];
            }
            if (!chat.recent) {
                chat.recent = {};
            }
            state.all.push(chat);
        },
        addMessage(state, { chatId, message }) {
            if (!message || typeof chatId != "number") {
                return;
            }
            const chat = state.all.find(c => c.id == chatId);
            if (chat) {
                message.status = null;

                // Incase has chat in cache
                if (message.from && message.from.issuer) {
                    const me = this.state.users.me;
                    message._isMe = message.from.issuer == me.id;
                }

                if (!chat.messages) {
                    chat.messages = [message];
                    informNewMessage(message);
                } else {
                    const foundMessage = chat.messages.find(
                        i => i.id == message.id
                    );
                    if (!foundMessage) {
                        chat.messages.push(message);
                    } else {
                        Object.assign(foundMessage, message);
                    }
                    informNewMessage(message);
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
                            "It has been removed by owner";
                    }
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
    },
    actions: {
        async initialize(ctx) {
            eventBus = window.IoC.get("bus");
            const { commit, rootState } = ctx;
            const me = rootState.users.me;
            const res = await convService.getAllByUser(me.id);
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
                    }
                }
            }

            commit("setAll", convList);

            // Setup Socket
            await this.dispatch("chats/setupSocket");

            // Get message history from server after configured socket
            if (convList) {
                for (let index = 0; index < convList.length; index++) {
                    const conv = convList[index];

                    // Load conversation content
                    const content = await this.dispatch(
                        "chats/getConversationContent",
                        conv.id
                    );
                    conv.messages = content || [];
                    conv.recent =
                        conv.messages.length > 0
                            ? conv.messages[conv.messages.length - 1]
                            : {};

                    // Update Me info
                    conv.messages.forEach(msg => {
                        if (msg.from && msg.from.issuer == me.id) {
                            msg._isMe = true;
                        }
                    });
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
        activeChat({ commit, state }, id) {
            if (state.active && state.active.id == id) {
                return state.active;
            }

            const chat = state.all.find(i => i.id == id);
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
        sendMessage({ commit }, { chatId, body }) {
            return messageService.create(parseInt(chatId), body).then(res => {
                const payload = {
                    chatId,
                    message: res.data,
                };
                commit("addMessage", payload);
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
                // Send confirm message
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
                
                const chatId = message.to.conversation;
                // Handle event
                switch (act) {
                    case "created":
                        if (!data.payload || !data.payload) {
                            break;
                        }

                        {
                            const existingConv = state.all.find(
                                i => i.id == chatId
                            );
                            if (existingConv) {
                                commit("addMessage", { chatId, message });
                            } else {
                                // Incase no chat in cache.
                                this.dispatch("chats/loadChat", chatId)
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
                    case "rejected":
                        commit("rejectedMessage", data);
                        break;
                    case "removed":
                        commit("removeMessage", { chatId, message });
                        break;

                    default:
                        console.warn("Unsupported message.", data);
                        break;
                }
            });
        },
    },
};

module.exports = moduleState;

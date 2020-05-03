const messageService = new (require("../../services/message.service").default)();
const convService = new (require("../../services/conversation.service").default)();
const messageQueueSvr = new (require("../../services/message-queue.service.js").default)();
let eventBus = null;

function handleWSMessage(socket, state, commit, act, data) {
    const message = data.payload;
    const convId = message.to.conversation;
    const me = this.state.users.me;

    // Send confirm message
    const confirmMsgFn = function confirm() {
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


    const findConv = function find() {
        return state.channel.all
            .concat(state.chat.all)
            .find(conv => {
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
    }

    // Handle event
    switch (act) {
        case "created":
            if (!data.payload || !data.payload) {
                break;
            } else {
                const existingConv = findConv();

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
                    this.dispatch("conversations/loadConversation", convId)
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

                // Config message
                const me = this.state.users.me;
                if (message.from && message.from.issuer == me.id) {
                    confirmMsgFn();
                }
            }
            break;
        case "reacted":
        case "updated":
            commit("updateMessage", { convId, message });
            confirmMsgFn();
            break;
        case "removed":
            commit("removeMessage", { convId, message });
            confirmMsgFn();
            break;

        default:
            console.warn("Unsupported message.", data);
            break;
    }
}

function handleWSConversation(socket, state, commit, act, data) {
    const payload = data.payload;
    // Send confirm message
    const confirmMsgFn = function confirm() {
        socket.emit("confirm", {
            status: "confirmed",
            id: data.id,
            type: data.type,
            action: act,
            payload: {
                id: payload.id,
            },
        });
    };
    confirmMsgFn();

    const convId = payload.id;
    const me = this.state.users.me;
    switch (act) {
        case "created":
            if (payload.subscribers.includes(me.id)) {
                this.dispatch("conversations/loadConversation", convId).catch(
                    console.error
                );
            }
            break;
        case "updated":
            if (payload.subscribers.includes(me.id)) {
                this.dispatch("conversations/loadConversation", convId).catch(
                    console.error
                );
            } else {
                commit("removeConv", convId);
            }
            break;
        case "removed":
            commit("removeConv", convId);
            break;
        case "left":
            {
                if (!payload.subscribers.includes(me.id)) {
                    commit("removeConv", convId);
                } else {
                    const existing = state.channel.all
                        .concat(state.chat.all)
                        .find(con => con.id == convId);
                    if (existing) {
                        this.dispatch(
                            "users/resolve",
                            payload.subscribers
                        ).then(subscribers => {
                            payload.subscribers = subscribers;
                            Object.assign(existing, payload);
                        });
                    }
                }
            }
            break;
    }
}

const moduleState = {
    namespaced: true,
    state: {
        chat: {
            active: null,
            all: [],
            unread: []
        },
        channel: {
            active: null,
            all: [],
            unread: []
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

            if (conv.channel == true) {
                state.channel.active = conv;
            } else {
                state.chat.active = conv;
            }

            if (conv._isTemp != true && !conv.isVerified) {
                // Load conversation content
                this.dispatch(
                    "conversations/getConversationContent",
                    { convId: conv.id, top: 10 }
                ).then(() => {
                    conv.isVerified = true;
                });
            }
        },
        addConversation(state, conv) {
            if (!conv.messages) {
                conv.messages = [];
            }

            if (!conv.meta) {
                conv.meta = {
                    unreadMessages: [],
                };
            }

            conv.reachedFullHistories = false;

            // Update conversation name (NOT channel)
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

            eventBus.emit("conversation", "added", conv);
        },
        removeConv(state, convId) {
            const convList = [state.channel.all, state.chat.all];
            convList.forEach(all => {
                const index = all.findIndex(i => i.id == convId);
                if (index >= 0) {
                    const found = all[index];

                    // Reset active state
                    if (found == state.channel.active) {
                        state.channel.active = null;
                    } else if (found == state.chat.active) {
                        state.chat.active = null;
                    }

                    all.splice(index, 1);
                    eventBus.emit("conversation", "removed", found);
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
                const pushToUnread = function (message) {
                    if (!message._isMe) {
                        conv.meta.unreadMessages.push(message);

                        // Push information to unread
                        const unread = conv.channel == true ? state.channel.unread : state.chat.unread;
                        const foundConv = unread.find(c => c.id == convId);
                        if (!foundConv) {
                            unread.push(conv);
                        }
                    }
                };

                if (!conv.messages) {
                    conv.messages = [message];
                    pushToUnread(message);
                } else {
                    const foundMessage = conv.messages.find(
                        i => i.id == message.id
                    );
                    if (!foundMessage) {
                        conv.messages.push(message);
                        pushToUnread(message);
                    } else {
                        // Update existing message
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
                const index = conv.messages.findIndex(i => i.id == message.id);
                if (index >= 0) {
                    const existingMsg = conv.messages[index];
                    existingMsg.status = "removed";
                    setTimeout(() => {
                        // Lazy delete message. Recaculate index
                        const msgIndex = conv.messages.findIndex(
                            i => i.id == message.id
                        );
                        if (msgIndex >= 0) {
                            conv.messages.splice(msgIndex, 1);
                        }
                    }, 1 * 1000);
                }

                // Check unread message 
                const unreadMsgIndex = conv.meta.unreadMessages.findIndex(i => i.id == message.id);
                if (unreadMsgIndex >= 0) {
                    conv.meta.unreadMessages.splice(unreadMsgIndex, 1);

                    // Clean notification if needed
                    if (conv.meta.unreadMessages.length == 0) {
                        const unread = conv.channel == true ? state.channel.unread : state.chat.unread;
                        const convIndex = unread.findIndex(c => c.id === conv.id);
                        if (convIndex >= 0) {
                            unread.splice(convIndex, 1);
                        }
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
                    Object.assign(existingMsg, message);
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

            // Clean unread message
            if (conv) {
                conv.meta.unreadMessages.splice(0);
            }

            // Update notification
            [state.channel.unread, state.chat.unread].find(unread => {
                const index = unread.findIndex(conv => conv.id === convId);
                if (index >= 0) {
                    unread.splice(index, 1);
                    return true;
                }
                return false;
            });
        },
    },
    actions: {
        async initialize(ctx) {
            eventBus = window.IoC.get("bus");

            // Setup Socket
            await this.dispatch("conversations/setupSocket");

            const { state, commit, rootState } = ctx;
            const me = rootState.users.me;

            // Load all conversation related to current user
            const convList = await convService.getByUser(me.id).then(res => res.data);
            if (!convList) {
                commit("setModuleState", "initialized");
                return;
            }

            for (let index = 0; index < convList.length; index++) {
                const conv = convList[index];
                // Init required data
                conv.messages = [];
                conv.meta = { unreadMessages: [] };

                // Load subscriber information
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

                // Add message
                commit("addConversation", conv);

                if (!conv.channel) {
                    // Load message
                    await this.dispatch(
                        "conversations/getConversationContent",
                        { convId: conv.id, top: 4 }
                    );
                }
            }

            // Load unread message in queue
            const confirmedMsqIds = [];
            const convNotification = {
                "channel": {},
                "nonchannel": {}
            };
            const messageQueue = rootState.messageQueue;
            messageQueue.forEach(message => {
                if (message.type === "conversation") {
                    // All information related to conversation is already updated at above steps
                    confirmedMsqIds.push(message.id);
                    return;
                }

                // Ignore other message types
                if (message.type !== "message") {
                    return;
                }

                const convId = message.payload.to.conversation;
                const conv = convList.find(c => c.id == convId);

                if (!conv) {
                    // It may be that the conversation has been deleted
                    confirmedMsqIds.push(message.id);
                    return;
                }

                const rawMsg = message.payload;
                switch (message.action) {
                    case "created":
                        {
                            conv.meta.unreadMessages.push(rawMsg);
                            const notf = conv.channel == true ? convNotification.channel : convNotification.nonchannel;
                            if (!notf[conv.id]) {
                                notf[conv.id] = conv;
                            }
                        }
                        break;

                    default:
                        // Already confirmed after loading latest message
                        confirmedMsqIds.push(message.id);
                        break;
                }
            });

            // Update notification
            state.channel.unread = Object.values(convNotification.channel);
            state.chat.unread = Object.values(convNotification.nonchannel);

            // Confirm message queue
            if (confirmedMsqIds.length > 0) {
                messageQueueSvr.confirm(me.id, confirmedMsqIds).then(res => res.data);
            }

            commit("setModuleState", "initialized");
        },
        async createConversation({ commit, state }, convInfo) {
            const invalid =
                !convInfo ||
                !convInfo.subscribers ||
                convInfo.subscribers.length <= 0;
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
                commit("addConversation", newConv);
            }

            return newConv;
        },
        async updateConversation({ state }, convInfo) {
            const invalid =
                !convInfo ||
                !convInfo.subscribers ||
                convInfo.subscribers.length <= 0;
            if (invalid) {
                console.warn("The input data is invalid");
                return;
            }

            const entity = {
                id: convInfo.id,
                name: convInfo.name,
                channel: convInfo.channel,
                private: convInfo.private,
                subscribers: convInfo.subscribers,
            };

            // Create new conversation
            const latestEntity = (await convService.update(entity)).data;

            const existingConv = state.channel.all
                .concat(state.chat.all)
                .find(i => i.id == latestEntity.id);

            if (existingConv) {
                // Get subscribers info
                latestEntity.subscribers = await this.dispatch(
                    "users/resolve",
                    latestEntity.subscribers
                );

                Object.assign(existingConv, latestEntity);
            }

            return latestEntity;
        },
        async deleteConversation({ state }, convId) {
            const existingConv = state.channel.all
                .concat(state.chat.all)
                .find(i => i.id === convId);

            if (existingConv) {
                return await convService.delete(convId);
            }
        },
        async leaveConversation({ state, commit }, convId) {
            const existingConv = state.channel.all
                .concat(state.chat.all)
                .find(i => i.id === convId);

            if (existingConv) {
                const me = this.state.users.me;
                const newConv = await convService.leave(convId, me.id);
                commit("removeConv", convId);
                return newConv;
            }
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
            commit("addConversation", convInfo);
            commit("setActivate", convInfo);
            return convInfo;
        },
        async activeChat({ commit, state }, convId) {
            const conv = state.channel.all
                .concat(state.chat.all)
                .find(c => (c.id || c._id) == convId);
            if (conv) {
                const currentConv =
                    conv.channel == true
                        ? state.channel.active
                        : state.chat.active;
                if (currentConv) {
                    if (
                        currentConv.id == conv.id ||
                        (currentConv._id && currentConv._id == conv._id)
                    ) {
                        // Already activated
                        return;
                    }
                }

                commit("setActivate", conv);
                return conv;
            }
        },
        async loadConversation({ commit, state }, convId) {
            const editingConv = state.channel.all
                .concat(state.chat.all)
                .find(c => (c.id || c._id) === convId);

            if (editingConv) {
                return editingConv;
            }

            const conv = (await convService.getAllById(convId)).data;
            if (conv) {
                const subscribers = await this.dispatch(
                    "users/resolve",
                    conv.subscribers
                );
                conv.subscribers = subscribers || [];
                commit("addConversation", conv);

                // Load message
                await this.dispatch(
                    "conversations/getConversationContent",
                    { convId: conv.id, top: 2 }
                );
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

            return await messageService.create(conv.id, body).then(res => {
                const payload = {
                    convId: conv.id,
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
                commit("removeMessage", { convId, message });
                return msg.id;
            }
        },
        async getConversationContent({ state }, { convId, top }) {
            if (typeof convId == "number") {
                const conv = state.channel.all
                    .concat(state.chat.all)
                    .find(c => c.id == convId);

                if (!conv) {
                    return;
                }

                top = top || 10;
                const filter = { top };
                if (conv.messages.length > 0) {
                    filter.rightId = conv.messages[0].id
                }

                return await messageService.get(parseInt(convId), filter).then(res => {
                    return res.data;
                }).then(messages => {
                    if (messages.length < top) {
                        conv.reachedFullHistories = true;
                    }

                    if (messages.length <= 0) {
                        return;
                    }

                    if (!conv.meta) {
                        conv.meta = {
                            unreadMessages: [],
                        };
                    }

                    // Update message info
                    const me = this.state.users.me;
                    messages.forEach(msg => {
                        // Init required value
                        if (msg.from && msg.from.issuer == me.id) {
                            msg._isMe = true;
                        }
                        msg.status = null;
                    });

                    if (!conv.messages) {
                        conv.messages = messages;
                    } else {
                        for (let index = (messages.length - 1); index >= 0; index--) {
                            const msg = messages[index];
                            conv.messages.unshift(msg);
                        }
                    }

                    return messages;
                });
            }
            console.warn("Conversation Id is required")
        },
        setupSocket({ commit, state }) {
            const socket = window.IoC.get("socket");
            socket.on(
                "message",
                handleWSMessage.bind(this, socket, state, commit)
            );
            socket.on(
                "conversation",
                handleWSConversation.bind(this, socket, state, commit)
            );
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
                        return newMsg;
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
            if (conv && conv.meta.unreadMessages.length > 0) {
                const me = rootState.users.me;
                const msgIds = conv.meta.unreadMessages.map(m => m.id);
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

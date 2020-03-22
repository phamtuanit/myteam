const messageService = new (require("../../services/message.service").default)();
const convService = new (require("../../services/conversation.service").default)();

const moduleState = {
    namespaced: true,
    getters: {
        getAllChat: state => state.all,
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
            state.active = chat;
        },
        addChat(state, chat) {
            state.all.push(chat);
        },
        addMessage(state, { chatId, message }) {
            const chat = state.all.find(c => c.id == chatId);
            if (chat) {
                chat.messages = chat.messages || [];
            }
            chat.messages.push(message);
            chat.recent = message;
        },
    },
    actions: {
        async initialize(ctx) {
            const { commit, rootState } = ctx;
            const me = rootState.users.me;
            const res = await convService.getAllByUser(me.id);
            const convList = res.data;

            if (convList) {
                for (let index = 0; index < convList.length; index++) {
                    const conv = convList[index];
                    if (conv.subscribers && conv.subscribers.length > 0) {
                        // Get user info
                        const users = await this.dispatch("users/resolve", conv.subscribers);
                        conv.subscribers = users;
                    }
                }
            }
            commit("setAll", convList);

            // Setup Socket
            const socket = window.IoC.get("socket");
            socket.on("message", (act, data) => {
                console.info("---- WS-message:", act, data);
            });

            commit("setModuleState", "initialized");
        },
        async createChat({ commit }, friendId) {
            const me = this.state.users.me;
            const convInfo = {
                channel: false,
                subscribers: [me.id, friendId]
            }
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
                return;
            }

            const chat = state.all.find(i => i.id == id);
            if (chat) {
                commit("setActivate", chat);
                return chat;
            }
        },
        sendMessage({ commit, state }, { chatId, body }) {
            return messageService.create(parseInt(chatId), body).then(res => {
                const payload = {
                    chatId,
                    message: res.data
                }
                commit("addMessage", payload);
                return res.data;
            });
        },
    },
};

module.exports = moduleState;

let conversationSvr;

const moduleState = {
    namespaced: true,
    getters: {},
    state: {
        all: [],
        active: null,
        moduleState: "startup",
    },
    mutations: {
        setModuleState(state, moduleState) {
            state.moduleState = moduleState;
        },
        setAll(state, conversations) {
            if (conversations) {
                const me = this.state.users.me.id;
                conversations.forEach(conv => {
                    if (conv.subscribers.length > 0) {
                        const friend = conv.subscribers.find(u => u != me);
                        if (friend) {
                            conv.name = friend.firstname + friend.lastname;
                        }
                    }
                });
            }

            state.all = conversations;
        },
        setActivate(state, conversation) {
            state.active = conversation;
        },
    },
    actions: {
        async initialize(ctx) {
            const { commit, rootState } = ctx;
            const me = rootState.users.me;
            conversationSvr = new (require("../../services/conversation.service").default)();
            const res = await conversationSvr.getAllByUser(me.id);

            if (res && res.data) {
                commit("setAll", res.data);

                res.data.forEach(conv => {
                    if (conv.subscribers && conv.subscribers.length > 0) {
                        this.dispatch("users/require", conv.subscribers);
                    }
                });
            }

            commit("setModuleState", "initialized");
        },
    },
};

module.exports = moduleState;

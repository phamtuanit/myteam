const moduleState = {
    namespaced: true,
    getters: {},
    state: {
        all: [],
        active: null,
    },
    mutations: {
        setAll(state, conversations) {
            state.all = conversations;
        },
        setActivate(state, conversation) {
            state.active = conversation;
        },
    },
    actions: {
        initialize({ commit }) {
            return Promise.resolve();
        },
        getAll({ commit }) {
            // service.getConversation(res => {
            //     commit("setConversations", res.data);
            // });
        },
    },
};

module.exports = moduleState;

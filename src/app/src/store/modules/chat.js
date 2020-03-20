const conversationSvr = new (require("../../services/conversation.service").default)();

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
            conversationSvr.find().then(res => {
                commit("setAll", res.data);
            });
        },
    },
};

module.exports = moduleState;

const moduleState = {
    namespaced: true,
    state: {},
    mutations: {},
    actions: {
        initialize({ commit }) {
            return Promise.resolve();
        },
    },
    getters: {},
};

module.exports = moduleState;

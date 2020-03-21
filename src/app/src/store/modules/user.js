const service = new (require("../../services/user.service.js").default)();
const moduleState = {
    namespaced: true,
    state: {
        users: {},
        requireList: new Set(),
        me: null,
        moduleState: "startup",
    },
    getters: {
        getUser: state => (id) => state.users.find(u => u.id === id),
        getMe: state => state.me,
    },
    mutations: {
        setModuleState(state, moduleState) {
            state.moduleState = moduleState;
        },
        setMe(state, user) {
            state.me = user;
            state.users[user.id] = user;
        },
        require(state, userIds) {
            const userCache = this.state.users.users;
            if (Array.isArray(userIds)) {
                userIds.forEach(ui => {
                    if (!userCache[ui]) {
                        state.requireList.add(ui);
                    }
                });
            } else if (!userCache[userIds]) {
                state.requireList.add(userIds);
            }
        },
        cache(state, users) {
            if (Array.isArray(users)) {
                users.forEach(user => {
                    state.users[user.id] = user;
                    state.requireList.delete(user.id);
                });
            } else {
                state.users[users.id] = users;
                state.requireList.delete(users.id);
            }
        }
    },
    actions: {
        initialize({ commit }) {
            commit("setModuleState", "initialized");
        },
        require({ commit }, userId) {
            commit("require", userId);
        },
        resolve({ commit, getters }, userId) {
            let user = getters.getUser(userId);
            if (user) {
                return Promise.resolve(user);
            }

            return service.getById(userId).then(user => {
                commit("cache", user);
            });
        },
        async resolveAll({ state, commit }) {
            if (state.requireList.size > 0) {
                const res = await service.getByIds(Array.from(state.requireList));
                const users = res.data;

                if (users && users.length > 0) {
                    commit("cache", users);
                }
            }
        }
    },
};

module.exports = moduleState;

const service = new (require("../../services/user.service.js").default)();
const moduleState = {
    namespaced: true,
    state: {
        all: [],
        requireList: new Set(),
        me: null,
        moduleState: "startup",
    },
    getters: {
        getUser: state => (id) => state.all.find(i => i.id == id),
        getAll: state => state.all,
        getMe: state => state.me,
    },
    mutations: {
        setModuleState(state, moduleState) {
            state.moduleState = moduleState;
        },
        setMe(state, user) {
            user._isMe = true;
            state.me = user;
            state.all.push(user);
        },
        require(state, userIds) {
            const userCache = state.all;
            if (Array.isArray(userIds)) {
                userIds.forEach(ui => {
                    const exisintUser = userCache.find(i => i.id == ui);
                    if (!exisintUser && !state.requireList.has(ui)) {
                        state.requireList.add(ui);
                    }
                });
            } else {
                const exisintUser = userCache.find(i => i.id == userIds);
                if (!exisintUser && !state.requireList.has(userIds)) {
                    state.requireList.add(userIds);
                }
            }
        },
        cache(state, users) {
            const userCache = state.all;
            if (Array.isArray(users)) {
                users.forEach(user => {
                    const exisintUser = userCache.find(i => i.id == user.id);
                    if (exisintUser) {
                        Object.assign(exisintUser, user);
                    } else {
                        userCache.push(user);
                    }
                    state.requireList.delete(user.id);
                });
            } else {
                const exisintUser = userCache.find(i => i.id == users.id);
                if (exisintUser) {
                    Object.assign(exisintUser, users);
                } else {
                    userCache.push(users);
                }
                state.requireList.delete(users.id);
            }
        }
    },
    actions: {
        initialize({ commit }) {
            const socket = window.IoC.get("socket");
            socket.on("live", (act, data) => {
                console.info("---- WS-live:", act, data);
            });

            commit("setModuleState", "initialized");
        },
        require({ commit }, userId) {
            commit("require", userId);
        },
        async resolve({ commit, getters }, userId) {
            const users = Array.isArray(userId) ? userId : [userId];
            const result = {};
            const remainUserIds = [];

            users.forEach(userId => {
                result[userId] = { id: userId };
                // Try to find user in cache first
                const userInfo = getters.getUser(userId);
                if (userInfo) {
                    result[userId] = userInfo;
                } else {
                    remainUserIds.push(userId);
                }
            });

            // Request more from Server
            if (remainUserIds.length > 0) {
                const userList = (await service.getByIds(remainUserIds)).data;
                userList.forEach(userInfo => {
                    result[userInfo.id] = userInfo;
                });
                commit("cache", userList);
            }

            return Array.isArray(userId) ? Object.values(result) : Object.values(result)[0];
        },
        async resolveAll({ state, commit }) {
            if (state.requireList.size > 0) {
                const res = await service.getByIds(Array.from(state.requireList));
                const users = res.data;

                if (users && users.length > 0) {
                    commit("cache", users);
                }
            }
        },
        findUser({ commit }, text) {
            return service.search(text).then(res => {
                const users = res.data;
                const meId = this.state.users.me.id;
                const me = users.find(u => u.id == meId);
                if (me) {
                    me._isMe = true;
                }

                if (users.length > 0) {
                    commit("cache", users);
                }

                return users;
            });
        }
    },
};

module.exports = moduleState;

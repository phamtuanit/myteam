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
        getUser: state => id => state.all.find(i => i.id == id),
        getAll: state => state.all,
        getMe: state => state.me,
    },
    mutations: {
        setModuleState(state, moduleState) {
            state.moduleState = moduleState;
        },
        setMe(state, user) {
            user._isMe = true;
            user.status = "on";
            state.me = user;
            state.all.push(user);
        },
        require(state, userIds) {
            const userCache = state.all;
            if (Array.isArray(userIds)) {
                userIds.forEach(ui => {
                    const existingUser = userCache.find(i => i.id == ui);
                    if (!existingUser && !state.requireList.has(ui)) {
                        state.requireList.add(ui);
                    }
                });
            } else {
                const existingUser = userCache.find(i => i.id == userIds);
                if (!existingUser && !state.requireList.has(userIds)) {
                    state.requireList.add(userIds);
                }
            }
        },
        cache(state, users) {
            const userCache = state.all;
            if (Array.isArray(users)) {
                users.forEach(user => {
                    const existingUser = userCache.find(i => i.id == user.id);
                    if (existingUser) {
                        Object.assign(existingUser, user);
                    } else {
                        user.status = user.status || "off";
                        userCache.push(user);
                    }
                    state.requireList.delete(user.id);
                });
            } else {
                const existingUser = userCache.find(i => i.id == users.id);
                if (existingUser) {
                    Object.assign(existingUser, users);
                } else {
                    users.status = users.status || "off";
                    userCache.push(users);
                }
                state.requireList.delete(users.id);
            }
        },
        setStatus(state, { user, status }) {
            user.status = status;
        },
    },
    actions: {
        async initialize({ commit }) {
            // Setup Socket
            await this.dispatch("users/setupSocket");

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

            return Array.isArray(userId)
                ? Object.values(result)
                : Object.values(result)[0];
        },
        async resolveAll({ state, commit }) {
            if (state.requireList.size > 0) {
                const res = await service.getByIds(
                    Array.from(state.requireList)
                );
                const users = res.data;

                if (users && users.length > 0) {
                    commit("cache", users);
                }
            }
        },
        findUser({ commit }, text) {
            if (!text) {
                return [];
            }

            const [str, limit] = text.split("&");
            if (str === "#all") {
                // Get all users
                return service.getAll(limit).then(res => {
                    const users = res.data;
                    const meId = this.state.users.me.id;
                    const meList = users.filter(u => u.id == meId);

                    meList.forEach(u => {
                        u._isMe = true;
                    });

                    if (users.length > 0) {
                        commit("cache", users);
                    }

                    return users;
                });
            }

            return service.search(text).then(res => {
                const users = res.data;

                const meId = this.state.users.me.id;
                const meList = users.filter(u => u.id == meId);

                meList.forEach(u => {
                    u._isMe = true;
                });

                if (users.length > 0) {
                    commit("cache", users);
                }

                return users;
            });
        },
        setupSocket({ commit }) {
            const socket = window.IoC.get("socket");
            socket.on("live", (act, data) => {
                const user = data.user;
                switch (act) {
                    case "on":
                    case "off":
                        user.status = data.status;
                        commit("cache", user);
                        break;
                    case "broadcast":
                        this.dispatch("users/changeStatusAll", data.status);
                        break;

                    default:
                        console.warn("Unsupported message.", data);
                        break;
                }
            });
        },
        changeStatusAll({ state, commit }, status) {
            state.all.forEach(user => {
                if (user._isMe != true) {
                    user.status = status;
                    commit("setStatus", { user, status });
                }
            });
        },
    },
};

module.exports = moduleState;

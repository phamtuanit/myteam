const service = new (require("../../services/user.service.js").default)();
const moduleState = {
    namespaced: true,
    state: {
        all: [],
        requireList: {},
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
        require(state, { id, info }) {
            state.requireList[id] = info;
        },
        clearRequired(state, userId) {
            delete state.requireList[userId];
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
                });
            } else {
                const existingUser = userCache.find(i => i.id == users.id);
                if (existingUser) {
                    Object.assign(existingUser, users);
                } else {
                    users.status = users.status || "off";
                    userCache.push(users);
                }
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
        async require({ state, commit }, userIds) {
            if (Array.isArray(userIds)) {
                const refUsers = [];
                userIds.forEach(ui => {
                    let refUser = state.requireList[ui] || state.all.find(i => i.id == ui);
                    if (!refUser) {
                        refUser = {
                            id: ui,
                            firstName: null,
                            lastName: null,
                            fullName: ui,
                            mail: null,
                            phone: null,
                            role: 100,
                            status: "off",
                            userName: ui,
                        };
                        commit("require", { id: ui, info: refUser});
                    }
                    refUsers.push(refUser);
                });
                return refUsers;
            } else {
                const ui = userIds;
                let refUser = state.requireList[ui] || state.all.find(i => i.id == ui);
                if (!refUser) {
                    refUser = {
                        id: ui,
                        userName: ui,
                        firstName: null,
                        lastName: null,
                        fullName: ui,
                        mail: null,
                        phone: null,
                        role: 100,
                        status: "off",
                    };
                    commit("require", { id: ui, info: refUser});
                }
                return refUser;
            }
        },
        async resolve({ commit, state, getters }, userId) {
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
                const userToBeCache = [];
                userList.forEach(userInfo => {
                    result[userInfo.id] = userInfo;
                    if (state.requireList.length > 0) {
                        const refUser = state.requireList[userInfo.id];
                        if (refUser) {
                            // Update user information and keep reference
                            Object.assign(refUser, userInfo);
                            commit("clearRequired", userInfo.id);
                            userToBeCache.push(refUser);
                            return;
                        }
                    }
                    userToBeCache.push(userInfo);
                });
                commit("cache", userToBeCache);
            }

            return Array.isArray(userId)
                ? Object.values(result)
                : Object.values(result)[0];
        },
        async resolveAll({ state, commit }) {
            const requireList = Object.keys(state.requireList);
            if (requireList.length > 0) {
                const res = await service.getByIds(requireList);
                const users = res.data;

                if (users && users.length > 0) {
                    const toBeCached = [];
                    users.forEach(user => {
                        const refUser = state.requireList[user.id];
                        if (refUser) {
                            // Update user information and keep reference
                            Object.assign(refUser, user);
                            commit("clearRequired", user.id);
                            toBeCached.push(refUser);
                            return;
                        }
                        toBeCached.push(user);
                    });
                    commit("cache", toBeCached);
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
        setupSocket({ commit, state }) {
            const socket = window.IoC.get("socket");

            socket.on("live", (act, data) => {
                const user = data.user;
                switch (act) {
                    case "on":
                    case "off":
                        console.info("Received user status:", user.id, data.status);
                        user.status = data.status;
                        commit("cache", user);
                        break;
                    case "broadcast":
                        console.info("Received broadcast status:", data.status);
                        this.dispatch("users/changeStatusAll", data.status);
                        break;

                    default:
                        console.warn("Unsupported message.", data);
                        break;
                }
            });

            // Handle re-connect
            socket.on("connect", () => {
                console.info("Fetch all user statuses after WS reconnected.");
                const userIds = state.all.map(u => u.id);
                service.getByIds(userIds).then(res => {
                    const users = res.data;
                    if (users && users.length > 0) {
                        commit("cache", users);
                    }
                });
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

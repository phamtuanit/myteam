const config = require("../conf/system.json");
const baseServerAddr = config.env == "prd" ? window.location.origin : config.server.address;
const messageQueueSvr = new (require("../services/message-queue.service.js").default)();

module.exports = {
    startup(commit, store) {
        return new Promise((resolve, reject) => {
            console.info("Setting up: application setting");
            try {
                // Update theme
                if (window.localStorage.getItem("setting.theme")) {
                    const theme = JSON.parse(
                        window.localStorage.getItem("setting.theme")
                    );
                    commit("setTheme", theme);
                } else {
                    window.localStorage.setItem(
                        "setting.theme",
                        JSON.stringify(store.getters.theme)
                    );
                }

                window.IoC.register("theme", store.getters.theme);
                commit("setAppState", "authentication");
                resolve();
            } catch (err) {
                console.info("Setting up application setting.", err);
                reject(err);
            }
        });
    },
    authentication(commit) {
        return new Promise((resolve, reject) => {
            console.info("Setting up: authentication service");
            let auth = window.IoC.register("auth");
            if (!auth) {
                auth = new (require("../services/core/authentication.service.js"))();
                window.IoC.register("auth", auth);
            }

            // Waiting for token verification
            auth.getToken()
                .then(token => {
                    if (token) {
                        auth.getUser().then(user => {
                            commit("users/setMe", user);
                        });

                        commit("setAuthentication", true);
                        commit("setAppState", "http-injection");
                        resolve();
                    }
                    reject("No token found");
                })
                .catch(reject);
        });
    },
    "http-injection"(commit) {
        return new Promise((resolve, reject) => {
            try {
                console.info("Setting up: Axios");
                const axios = require("axios");
                axios.defaults.baseURL = baseServerAddr + config.server.api;

                const requestInterceptor = require("../utils/http-injector/request-injector.js");
                const responseInterceptor = require("../utils/http-injector/response-injector.js");
                requestInterceptor();
                responseInterceptor();

                commit("setAppState", "socket");
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    },
    socket(commit) {
        return new Promise((resolve, reject) => {
            try {
                console.info("Setting up: socket service");
                const Socket = require("../plugins/socket.js");
                const socket = new Socket(baseServerAddr, "/chat-io");
                window.IoC.register("socket", socket);
                socket.connect().then(() => {
                    commit("setAppState", "pull-message-queue");
                    resolve();
                }).catch(reject);
            } catch (error) {
                reject(error);
            }
        });
    },
    async "pull-message-queue"(commit) {
        console.info("Pull all messages in queue.");
        const me = this.state.users.me;
        const messages = (await messageQueueSvr.getAll(me.id)).data;

        commit("setMessageQueue", messages);
        commit("setAppState", "modules-user");
    },
    "modules-user"(commit, store) {
        return new Promise((resolve, reject) => {
            console.info("Setting up: users module");
            try {
                store.dispatch("users/initialize")
                    .then(() => {
                        commit("setAppState", "modules-conversation");
                        resolve();
                    })
                    .catch(reject);
            } catch (err) {
                reject(err);
            }
        });
    },
    "modules-conversation"(commit, store) {
        return new Promise((resolve, reject) => {
            console.info("Setting up: chat module");
            try {
                store.dispatch("conversations/initialize")
                    .then(() => {
                        commit("setAppState", "resolve-users");
                        resolve();
                    })
                    .catch(reject);
            } catch (err) {
                reject(err);
            }
        });
    },
    // "modules-channel"(commit, store) {
    //     return new Promise((resolve, reject) => {
    //         console.info("Setting up: chat module");
    //         try {
    //             store.dispatch("channels/initialize")
    //                 .then(() => {
    //                     commit("setAppState", "resolve-users");
    //                     resolve();
    //                 })
    //                 .catch(reject);
    //         } catch (err) {
    //             reject(err);
    //         }
    //     });
    // },
    "resolve-users"(commit, store) {
        return new Promise((resolve, reject) => {
            console.info("Setting up: chat module");
            try {
                store.dispatch("users/resolveAll")
                    .then(() => {
                        commit("setAppState", "end");
                        resolve();
                    })
                    .catch(reject);
            } catch (err) {
                reject(err);
            }
        });
    },
    end(commit) {
        commit("setAppState", "finished");
        commit("setInitialization", true);
        console.info("Setting up application successfully");
    }
};

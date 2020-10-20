const config = require("../conf/system.json");
const Socket = require("../plugins/socket.js");
const baseServerAddr = (config.env == "prd" ? window.location.origin : config.server.address + `:${config.server.port}`);
const ioBaseAddr = (config.env == "prd" ? (window.location.protocol + window.location.host) : config.server.io.address) + `:${config.server.io.port}`;
const messageQueueSvr = new (require("../services/message-queue.service.js").default)();
const notification = new (require("../plugins/notification.js"))();

module.exports = {
    startup(commit, store) {
        console.info(">>>>>>>>> API Server:", baseServerAddr);
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

                window.IoC.register("notification", notification);

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
                requestInterceptor(axios);
                responseInterceptor(axios);

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
                const socket = new Socket(ioBaseAddr, config.server.io.path);
                window.IoC.register("socket", socket);

                const onConnect = () => {
                    commit("setAppState", "pull-message-queue");
                    socket.off("connect", onConnect);
                    resolve();
                };
                socket.on("connect", onConnect);
                socket.connect();
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

        // Handle re-connect
        const socket = window.IoC.get("socket");
        socket.on("connect", async () => {
            messageQueueSvr
                .getAll(me.id)
                .then(res => {
                    commit("setMessageQueue", res.data);
                    // Confirm message in queue
                    this.dispatch("conversations/checkMessageQueue");
                })
                .catch(console.error);
        });
    },
    "modules-user"(commit, store) {
        return new Promise((resolve, reject) => {
            console.info("Setting up: users module");
            try {
                store
                    .dispatch("users/initialize")
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
                store
                    .dispatch("conversations/initialize")
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
    "resolve-users"(commit, store) {
        return new Promise((resolve, reject) => {
            console.info("Setting up: chat module");
            try {
                store
                    .dispatch("users/resolveAll")
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
        console.info("Application is ready");
        // informApplication();
    },
};

// function informApplication() {
//     // Notify Desktop app
//     const bus = window.IoC.get("bus");

//     const Axios = require("axios");
//     const axiosInstance = Axios.create({
//         baseURL:
//             config.env == "prd"
//                 ? window.location.origin
//                 : config.server.address,
//     });
//     axiosInstance.get("/application.json").then(res => {
//         const { latest_version } = res.data;
//         const icon = `<i class="v-icon notranslate mdi mdi-download-outline"></i>`;
//         const filePath = `/attachments/application/myteam-win-portable.${latest_version}.exe`;
//         let msg = `<span>Get Desktop application <a href="${filePath}" target="_blank" class="ml-1 white--text" style="text-decoration:none">${icon}</a></span>`;
//         if (!window.isElectron) {
//             // setTimeout(() => {
//             //     bus.emit("show-snack", {
//             //         message: msg,
//             //         type: "info",
//             //         timeout: 10000,
//             //     });
//             // }, 2000);
//         } else {
//             if (
//                 !window.app ||
//                 !window.app.version ||
//                 latest_version != window.app.version
//             ) {
//                 msg = `<span>New version available V${latest_version} <a href="${filePath}" target="_blank" class="ml-1 white--text" style="text-decoration:none">${icon}</a></span>`;
//                 setTimeout(() => {
//                     bus.emit("show-snack", {
//                         message: msg,
//                         type: "info",
//                         timeout: 10000,
//                     });
//                 }, 2000);
//             }
//         }
//     });
// }

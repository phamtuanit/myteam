const Vuex = require("vuex");
const Vue = require("vue").default;
const createLogger = require("vuex/dist/logger");
const chatModule = require("./modules/chat");
const channelModule = require("./modules/channel");

// Setup IoC
const ServiceLocator = require("../services/core/service-locator.js");
window.IoC = window.ServiceLocator = new ServiceLocator();

// Setup event Bus
const eventBus = new (require("../services/core/emitter"))();
window.IoC.register("bus", eventBus);

// Load config
const config = require("../conf/system.json");
window.IoC.register("config", config);

// Define base API address
const baseServerAddr =
    config.env == "production" ? window.location.origin : config.server.address;

Vue.use(Vuex);
const store = new Vuex.Store({
    plugins: [createLogger()],
    state: {
        initialized: false,
        authenticated: false,
        theme: {
            dark: true,
        },
    },
    getters: {
        initialized: state => state.initialized,
        authenticated: state => state.authenticated,
        theme: state => state.theme,
    },
    mutations: {
        setInitialization(state, status) {
            state.initialized = status;
        },
        setAuthentication(state, status) {
            state.authenticated = status;
        },
        setTheme(state, theme) {
            state.theme = theme;
        },
    },
    actions: {
        setTheme({ commit }, theme) {
            window.localStorage.setItem("setting.theme", JSON.stringify(theme));
            commit("setTheme", theme);
        },
        initialize({ commit }) {
            console.info("Setting up application");
            const tasks = [];
            let task = new Promise((resolve, reject) => {
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
                            JSON.stringify(this.getters.theme)
                        );
                    }

                    window.IoC.register("theme", this.getters.theme);
                    resolve();
                } catch (err) {
                    console.info("Setting up application setting.", err);
                    reject(err);
                }
            });
            tasks.push(task);

            task = new Promise((resolve, reject) => {
                console.info("Setting up: authentication service");
                const authentication = new (require("../services/core/authentication.js"))();
                window.IoC.register("auth", authentication);

                // Waiting for token verification
                authentication
                    .getToken()
                    .then(() => {
                        commit("setAuthentication", true);
                        resolve();
                    })
                    .catch(reject);
            });
            tasks.push(task);

            task = new Promise((resolve, reject) => {
                try {
                    console.info("Setting up: Axios");
                    const axios = require("axios");
                    axios.defaults.baseURL = baseServerAddr + config.server.api;

                    const requestInterceptor = require("../services/http-injector/request-injector.js");
                    const responseInterceptor = require("../services/http-injector/response-injector.js");
                    requestInterceptor();
                    responseInterceptor();
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
            tasks.push(task);

            const socketTask = new Promise((resolve, reject) => {
                try {
                    console.info("Setting up: socket service");
                    const Socket = require("../services/socket.js");
                    const socket = new Socket(baseServerAddr, "/chat-io");
                    socket
                        .connect()
                        .then(() => {
                            window.IoC.register("socket", socket);
                            resolve(socket);
                        })
                        .catch(reject);
                } catch (error) {
                    reject(error);
                }
            });
            tasks.push(socketTask);

            task = new Promise((resolve, reject) => {
                socketTask.then(socket => {
                    console.info("Setting up: chat module");
                    try {
                        this.dispatch("chat/initialize", socket)
                            .then(resolve)
                            .catch(reject);
                    } catch (err) {
                        reject(err);
                    }
                });
            });
            tasks.push(task);

            task = new Promise((resolve, reject) => {
                socketTask.then(socket => {
                    console.info("Setting up: channel module");
                    try {
                        this.dispatch("channel/initialize", socket)
                            .then(resolve)
                            .catch(reject);
                    } catch (err) {
                        reject(err);
                    }
                });
            });
            tasks.push(task);

            return Promise.all(tasks)
                .then(() => {
                    console.info("Setting up application successfully");
                    commit("setInitialization", true);
                })
                .catch(err => {
                    const socket = window.IoC.get("socket");
                    if (socket) {
                        socket.close();
                    }
                    console.info("Setting up application failed.", err);
                    commit("setInitialization", false);
                });
        },
    },
    modules: {
        chat: chatModule,
        channel: channelModule,
    },
});

module.exports = store;

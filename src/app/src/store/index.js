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
    },
    getters: {
        initialized: state => state.initialized,
        authenticated: state => state.authenticated,
    },
    mutations: {
        setInitialization(state, status) {
            state.initialized = status;
        },
        setAuthentication(state, status) {
            state.authenticated = status;
        },
    },
    actions: {
        initialize({ commit }) {
            console.info("Setting up application");
            return new Promise((resolve, reject) => {
                try {
                    // Update theme
                    let theme = JSON.parse(
                        window.localStorage.getItem("setting.theme")
                    );
                    theme = theme || {
                        theme: {
                            dark: true,
                        },
                    };
                    window.IoC.register("theme", theme);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            })
                .then(() => {
                    console.info("Setting up: authentication service");
                    const authentication = new (require("../services/core/authentication.js"))();
                    window.IoC.register("auth", authentication);

                    // Waiting for token verification
                    return authentication.getToken().then(() => {
                        commit("setAuthentication", true);
                    });
                })
                .then(() => {
                    console.info("Setting up: Axios");
                    const axios = require("axios");
                    axios.defaults.baseURL = baseServerAddr + config.server.api;

                    const requestInterceptor = require("../services/http-injector/request-injector.js");
                    const responseInterceptor = require("../services/http-injector/response-injector.js");
                    requestInterceptor();
                    responseInterceptor();
                })
                .then(() => {
                    console.info("Setting up: socket service");
                    const Socket = require("../services/socket.js");
                    const socket = new Socket(baseServerAddr, "/chat-io");
                    window.IoC.register("socket", socket);
                })
                .then(() => {
                    console.info("Setting up application successfully");
                    commit("setInitialization", true);
                })
                .catch(err => {
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

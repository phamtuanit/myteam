const Vuex = require("vuex");
const Vue = require("vue").default;
const createLogger = require("vuex/dist/logger");
const chatModule = require("./modules/chat");
const channelModule = require("./modules/channel");
const userModule = require("./modules/user");

// Setup IoC
const ServiceLocator = require("../plugins/service-locator.js");
window.IoC = window.ServiceLocator = new ServiceLocator();

// Setup event Bus
const eventBus = new (require("../plugins/emitter"))();
window.IoC.register("bus", eventBus);

const appStateMap = require("./app-state.js");

Vue.use(Vuex);
const store = new Vuex.Store({
    plugins: [createLogger()],
    state: {
        appState: "startup",
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
        appState: state => state.appState,
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
        setAppState(state, appState) {
            state.appState = appState;
        },
    },
    actions: {
        async setTheme({ commit }, theme) {
            window.localStorage.setItem("setting.theme", JSON.stringify(theme));
            commit("setTheme", theme);
            return theme;
        },
        initialize({ commit }) {
            const state = this.getters.appState;
            console.info("Setting up application.", state);

            const task = appStateMap[state];
            if (task && typeof task == "function") {
                return task(commit, this);
            }
            return Promise.resolve();
        },
    },
    methods: {
        startup() { },
    },
    modules: {
        chats: chatModule,
        channels: channelModule,
        users: userModule
    },
});

module.exports = store;

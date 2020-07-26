// Setup IoC
const ServiceLocator = require("../plugins/service-locator.js");
window.IoC = window.ServiceLocator = new ServiceLocator();

// Setup event Bus
const eventBus = new (require("../plugins/emitter"))();
window.IoC.register("bus", eventBus);

const Vuex = require("vuex");
const Vue = require("vue").default;
const sysConfig = require("../conf/system.json");
const createLogger = require("vuex/dist/logger");
const conversationModule = require("./modules/conversation.js");
const userModule = require("./modules/user");
const appStateMap = require("./app-state.js");

const plugins = [];

// Prepare plugins
if (sysConfig.env != "prd") {
    plugins.push(createLogger());
}

Vue.use(Vuex);
const store = new Vuex.Store({
    plugins: plugins,
    state: {
        appState: "startup",
        initialized: false,
        authenticated: false,
        theme: {
            dark: false,
        },
        messageQueue: [],
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
        setMessageQueue(state, queue) {
            state.messageQueue = queue;
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
                return task.bind(this)(commit, this);
            }
            return Promise.resolve();
        },
    },
    methods: {
        startup() {},
    },
    modules: {
        users: userModule,
        conversations: conversationModule,
    },
});

module.exports = store;

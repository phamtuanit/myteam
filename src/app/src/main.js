import Vue from "vue";
import App from "./App.vue";
import vuetify from "./plugins/vuetify";

const store = require("./store/index");
window.IoC.register("store", store);

import VueScroll from "./utils/directives/index.js";
Vue.use(VueScroll);

const VueRouter = require("vue-router").default;
Vue.use(VueRouter);
const router = require("./plugins/vue-router").default(store);

// Check electron environment
// eslint-disable-next-line no-undef
window.isElectron = APP_PRODUCTION && typeof process != "undefined" && process.platform != "browser";
if (window.isElectron == true) {
    setupElectronEnv();
} else {
    const IPC = require("./plugins/empty-ipc-render.js");
    window.IoC.register("ipc", new IPC());
}

Vue.config.productionTip = false;
new Vue({
    vuetify,
    router: router,
    store,
    data: () => ({}),
    render: h => h(App),
    created() {
        // Blink tray icon in Electron Env
        window.IoC.get("ipc").send("set-progress", 1, "indeterminate");
        // Prepare application
        if (this.$route.name !== "preparation") {
            this.$router.push({ name: "preparation" });
        }
    },
    watch: {},
}).$mount("#app");

function setupElectronEnv() {
    const electron = require("electron");
    const ipcRenderer = electron.ipcRenderer;
    window.IoC.register("ipc", ipcRenderer);

    window.app = {};
    ipcRenderer.on("set-data", (sender, data) => {
        window.app = data;
    });
    ipcRenderer.send("get-data");
}

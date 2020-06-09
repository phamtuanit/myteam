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
window.isElectron = typeof process != "undefined";
if (window.isElectron == true) {
    setupElectonEnv();
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

function setupElectonEnv() {
    const electron = require("electron");
    const ipcRenderer = electron.ipcRenderer;
    window.IoC.register("ipc", ipcRenderer);

    window.app = {};
    ipcRenderer.on("set-data", (sender, data) => {
        window.app = data;

        // Setup content menu
        const { Menu } = electron.remote;
        const contextMenu = Menu.buildFromTemplate([
            { label: "Cut", role: "cut" },
            { label: "Copy", role: "copy" },
            { label: "Paste", role: "paste" },
            { label: "Select All", role: "selectall" },
            { label: "Delete", role: "delete" },
            { type: "separator" },
            {
                label: "App",
                submenu: [
                    { role: "reload" },
                    // { role: "forcereload" },
                    { type: "separator" },
                    { role: "resetzoom" },
                    { role: "zoomin" },
                    { role: "zoomout" },
                    { type: "separator" },
                    { label: "Version: " + window.app.version },
                ],
            },
        ]);

        document.addEventListener("contextmenu", event => {
            event.preventDefault();
            contextMenu.popup();
        });
    });
    ipcRenderer.send("get-data");
}

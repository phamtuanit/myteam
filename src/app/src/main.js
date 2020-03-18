import Vue from "vue";
import App from "./App.vue";
import vuetify from "./plugins/vuetify";

import VueChatScroll from 'vue-chat-scroll'
Vue.use(VueChatScroll);

import ServiceLocator from "./services/core/service-locator.js";
window.IoC = window.ServiceLocator = new ServiceLocator();

import Emiter from "./services/core/emiter";
const eventBus = new Emiter();
window.IoC.register("bus", eventBus);

import sysConfig from "./conf/system.json";
window.IoC.register("config", sysConfig);

import Authentication from "./services/core/authentication.js";
window.IoC.register("auth", new Authentication);

const axios = require("axios");
const baseServerAddr = sysConfig.env == "production" ? window.location.origin : sysConfig.server.address;
axios.defaults.baseURL = baseServerAddr + sysConfig.server.api;

const requestInterceptor = require("./services/http-injector/request-injector.js");
const responseInterceptor = require("./services/http-injector/response-injector.js");
requestInterceptor();
responseInterceptor();

const Socket = require("./services/socket.js");
const socket = new Socket(baseServerAddr, "/chat-io");
window.IoC.register("socket", socket);

Vue.config.productionTip = false;

import VueRouter from "vue-router";
import router from "./plugins/vue-router";
Vue.use(VueRouter);
new Vue({
    vuetify,
    router: router,
    provide: { config: sysConfig },
    data() {
        return {
            theme: {
                dark: false,
            },
        };
    },
    render: h => h(App),
    created() {
        // Update theme
        const tempTheme = JSON.parse(window.localStorage.getItem("setting.theme"));
        if (tempTheme) {
            Object.assign(this.theme, tempTheme);
        }

        this.$vuetify.theme.dark = this.theme.dark == true;
        window.IoC.register("theme", this.theme);
    },
    watch: {
        theme: {
            deep: true,
            handler: function (newVal) {
                if (newVal) {
                    window.localStorage.setItem("setting.theme", JSON.stringify(newVal));
                    this.$vuetify.theme.dark = newVal.dark;
                }
            },
        },
    },
}).$mount("#app");

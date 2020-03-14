import Vue from "vue";
import App from "./App.vue";
import vuetify from "./plugins/vuetify";

import VueChatScroll from 'vue-chat-scroll'
Vue.use(VueChatScroll);

import ServiceLocator from "./services/core/service-locator.js";
window.IoC = window.ServiceLocator = new ServiceLocator();

import eventBus from "./services/core/event-bus.js";
window.IoC.register("bus", eventBus);

import sysConfig from "./conf/system.json";
window.IoC.register("config", sysConfig);

import authentication from "./services/core/authentication.js";
window.IoC.register("auth", authentication);

const axios = require("axios");
const baseServerAddr = sysConfig.env == "production" ? window.location.origin : sysConfig.server.address;
axios.defaults.baseURL = baseServerAddr + sysConfig.server.api;

const requestInterceptor = require("./services/http-injector/request-injector.js");
const responseInterceptor = require("./services/http-injector/response-injector.js");
requestInterceptor();
responseInterceptor();

Vue.config.productionTip = false;
new Vue({
    vuetify,
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
            handler: function(newVal) {
                if (newVal) {
                    window.localStorage.setItem("setting.theme", JSON.stringify(newVal));
                    this.$vuetify.theme.dark = newVal.dark;
                }
            },
        },
    },
}).$mount("#app");

import Vue from "vue";
import App from "./App.vue";
import vuetify from "./plugins/vuetify";

import VueChatScroll from "vue-chat-scroll";
Vue.use(VueChatScroll);

const store = require("./store/index");
window.IoC.register("store", store);

const VueRouter = require("vue-router").default;
Vue.use(VueRouter);
const router = require("./plugins/vue-router").default(store);

import VueRouterMultiView from "vue-router-multi-view";
Vue.use(VueRouterMultiView);

Vue.config.productionTip = false;
new Vue({
    vuetify,
    router: router,
    store,
    data: () => ({}),
    render: (h) => h(App),
    created() {
        if (this.$route.name !== "preparation") {
            this.$router.push({ name: "preparation" });
        }
    },
    watch: {},
}).$mount("#app");

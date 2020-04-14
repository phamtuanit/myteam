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

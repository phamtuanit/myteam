import VueRouter from "vue-router";
import Preparation from "../pages/preparation.vue";
import Main from "../pages/main.vue";
import Chat from "../pages/chat/index.vue";

export default function init(store) {
    VueRouter.prototype.updateQuery = function update(query) {
        const newQuery = JSON.parse(JSON.stringify(query));
        return this.replace({ query: newQuery });
    }
    const router = new VueRouter({
        routes: [
            { path: "/", name: "root", redirect: { name: "preparation" } },
            {
                path: "/error",
                name: "system-error",
                component: () => import(/* webpackChunkName: "system-error" */ "../pages/errors/system-error.vue"),
            },
            {
                path: "/login",
                name: "login",
                component: () => import(/* webpackChunkName: "login" */ "../pages/login.vue"),
            },
            {
                path: "/app",
                name: "app",
                component: Main,
                children: [
                    {
                        name: "app-chat",
                        path: "chat",
                        component: Chat,
                    },
                    {
                        name: "app-channel",
                        path: "channel",
                        component: () => import(/* webpackPreload: true */ "../pages/channel/index.vue"),
                    },
                ],
            },
            {
                name: "preparation",
                path: "/preparation",
                component: Preparation,
            },
        ],
    });

    function redirect(target, from, to, next) {
        const query = to.query;

        // Update query
        if (query["next-to"] !== to.name) {
            query["next-to"] = to.name;
        }

        const params = to.params;
        next({ name: target, query, params });
    }

    router.beforeEach((to, from, next) => {
        if (to.query["next-to"] == to.name) {
            delete to.query["next-to"];
        }

        if (to.name.includes("error")) {
            return next();
        }

        const initialized = store.getters.initialized;
        if (to.name == "preparation" && !initialized) {
            // Need to be initialized
            return next();
        }

        const appState = store.getters.appState;
        if (!initialized && appState == "startup") {
            // App is not initialized yet
            return redirect("preparation", from, to, next);
        }

        const authenticated = store.getters.authenticated;
        if (to.name == "login" && authenticated) {
            // Need to be logged in
            next({ name: "root" });
            return;
        }

        if (to.name == "login" && !authenticated) {
            // User want to login but they didn't login yet
            next();
            return;
        }

        if (!authenticated) {
            // No token, go to login from
            redirect("login", from, to, next);
            return;
        }
        next();
    });
    return router;
}

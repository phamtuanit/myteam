import VueRouter from "vue-router";
import Preparation from "../pages/preparation.vue";

export default function init(store) {
    const router = new VueRouter({
        routes: [
            { path: "/", name: "root", redirect: { name: "preparation" } },
            {
                path: "/error",
                name: "system-error",
                component: () => import("../pages/errors/system-error.vue"),
            },
            {
                path: "/login",
                name: "login",
                component: () => import("../pages/login.vue"),
            },
            {
                path: "/app",
                name: "app",
                component: () => import("../pages/main.vue"),
                children: [
                    {
                        name: "app-chat",
                        path: "chat",
                        component: () => import("../pages/chat/index.vue"),
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
        const params = to.params;
        query["next-to"] = to.name;
        next({ name: target, query, params });
    }

    router.beforeEach((to, from, next) => {
        // Update query
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

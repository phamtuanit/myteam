import VueRouter from "vue-router";
import Preparation from "../pages/preparation.vue";
import Login from "../pages/login.vue";
import MainApp from "../pages/main.vue";

const socket = window.IoC.get("socket");
const auth = window.IoC.get("auth");

const router = new VueRouter({
    routes: [
        { path: "/", name: "root", redirect: { name: "preparation" } },
        { path: "/login", name: "login", component: Login },
        {
            path: "/app",
            name: "app",
            component: MainApp,
            children: [
                {
                    name: "app-chat",
                    path: "chat",
                    component: () => import("../pages/chat/index.vue"),
                },
                // {
                //     name: "app-channel",
                //     path: "channel",
                //     component: () => import("../pages/channel/index.vue"),
                // },
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
    const token = auth.getToken();
    token
        .then(token => {
            if (to.name == "login" && token) {
                next({ name: "root" });
                return;
            }

            if (to.name == "login" && !token) {
                // User want to login but they didn't login yet
                next();
                return;
            }

            if (!token) {
                // No token, go to login from
                redirect("login", from, to, next);
                return;
            }

            if (!socket.getStatus() && to.name !== "preparation") {
                // The application is not prepared yet
                redirect("preparation", from, to, next);
                return;
            }
            next();
        })
        .catch(() => {
            redirect(from, to, next);
        });
});

export default router;

import VueRouter from "vue-router";
import Preparation from "../pages/preparation.vue";
import Login from "../pages/login.vue";

const router = new VueRouter({
    routes: [
        { path: "/", name: "root", redirect: { name: "preparation" } },
        { path: "/login", name: "login", component: Login },
        {
            name: "preparation",
            path: "/preparation",
            component: Preparation,
            children: [],
        },
    ],
});

router.beforeEach((to, from, next) => {
    const auth = window.IoC.get("auth");
    const token = auth.getToken();
    token.then(token => {
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
            const query = from.query;
            query["next-to"] = to.name;
            next({ name: "login", query });
            return;
        }
        next();
    });
});

export default router;

<template>
    <v-container class="login-screen fill-height bg-1" fluid id="login-screen">
        <div align="center" justify="center" class="mx-auto">
            <v-card :loading="loading" max-width="400" light>
                <v-img height="200" src="@/assets/images/mountain.jpg">
                    <div class="px-2 white--text center-y fill-height">
                        <v-img
                            max-width="100%"
                            src="@/assets/images/banner.png"
                        ></v-img>
                    </div>
                </v-img>

                <v-card-text>
                    <v-form>
                        <v-text-field
                            v-model="userName"
                            label="Login"
                            name="username"
                            prepend-icon="mdi-account"
                            type="text"
                            class="pt-1"
                        />

                        <v-text-field
                            v-model="password"
                            id="password"
                            label="Password"
                            name="password"
                            prepend-icon="mdi-lock"
                            type="password"
                            @keyup.enter="login"
                        />
                    </v-form>
                </v-card-text>
                <v-card-actions class="px-4 pt-0">
                    <v-spacer />
                    <v-btn
                        text
                        @click="login"
                        :disabled="loading"
                        class="btn-login color-1"
                        >Login</v-btn
                    >
                </v-card-actions>
            </v-card>
        </div>
    </v-container>
</template>

<script>
export default {
    data() {
        return {
            loading: false,
            userName: null,
            password: null,
        };
    },
    created() {
        this.auth = window.IoC.get("auth");
    },
    methods: {
        login() {
            this.loading = true;
            this.auth
                .login(this.userName, this.password)
                .then(() => {
                    const store = this.$store;
                    const initialized = store.getters.initialized;
                    const route = this.$route;
                    if (initialized) {
                        const nextRoute = route.query["next-to"] || "root";
                        delete route.query["next-to"];
                        console.info("Redirect to:", nextRoute);
                        this.$router
                            .push({ name: nextRoute, query: route.query })
                            .catch(console.error);
                    } else {
                        this.$router
                            .push({ name: "preparation", query: route.query })
                            .catch(console.error);
                    }
                })
                .finally(() => {
                    this.loading = false;
                });
        },
    },
};
</script>

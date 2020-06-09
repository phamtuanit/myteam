<template>
    <v-app id="app">
        <v-snackbar
            v-model="snackbar.display"
            top
            :color="snackbar.background"
            :timeout="snackbar.timeout"
        >
            <div class="snackbar--body" v-html="snackbar.content"></div>
            <v-btn text @click="snackbar.display = false">
                Close
            </v-btn>
        </v-snackbar>
        <router-view key="page"></router-view>
    </v-app>
</template>

<script>
export default {
    name: "App",
    data() {
        return {
            snackbar: {
                background: null,
                display: false,
                content: "",
                timeout: 8000,
            },
        };
    },
    created() {
        const eventBus = window.IoC.get("bus");
        eventBus.on("show-snack", this.onShowSnack);
    },
    methods: {
        onShowSnack(info) {
            if (!info || !info.message) {
                this.snackbar.display = false;
                return;
            }

            // Update timout
            if (info.timeout == null) {
                this.snackbar.timeout = 10000;
            } else if (info.timeout <= 0) {
                this.snackbar.timeout = 0;
            } else {
                this.snackbar.timeout = info.timeout;
            }

            // Adjust message
            let content = info.message;
            if (content && typeof content == "object") {
                if (content.message) {
                    content = content.message;
                } else {
                    content = Object.prototype.toString.call(content);
                }
            }

            //  Show snack
            this.snackbar.content = content
                .replace(/\r\n/g, "<br/>")
                .replace(/\n/g, "<br/>");
            this.snackbar.background = info.type || null;
            this.snackbar.display = true;
        },
    },
};
</script>
<style lang="css">
@import "./assets/common.css";
@import "./assets/color.css";
@import "./assets/spinner.css";
</style>

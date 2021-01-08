<template>
    <v-app id="app">
        <v-snackbar
            v-model="snackbar.display"
            top
            :color="snackbar.background"
            :timeout="snackbar.timeout"
        >
            <div class="snackbar--body" v-html="snackbar.content"></div>
            <template v-slot:action="{ attrs }">
                <v-btn text v-bind="attrs" @click="onConfirmSnack" v-if="snackbar.confirm">
                    OK
                </v-btn>
                <v-btn text v-bind="attrs" @click="snackbar.display = false">
                    Close
                </v-btn>
            </template>
        </v-snackbar>
        <router-view key="root"></router-view>
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
                confirm: null
            },
        };
    },
    created() {
        const eventBus = window.IoC.get("bus");
        eventBus.on("show-snack", this.onShowSnack);
    },
    methods: {
        onShowSnack(info) {
            if (this.snackbar.display == true) {
                // Waiting for current message closed
                setTimeout(() => {
                    this.onShowSnack(info);
                }, this.snackbar.timeout > 0 ? this.snackbar.timeout : 1000);
            }

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

            this.snackbar.confirm = typeof info.confirm  === "function" ? info.confirm : null;

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
        onConfirmSnack() {
            this.snackbar.display = false;
            this.snackbar.confirm && this.snackbar.confirm();
        }
    },
};
</script>
<style lang="css">
@import "./assets/layout.scss";
@import "./assets/common.css";
@import "./assets/color.css";
@import "./assets/spinner.css";
@import "./assets/image.css";
</style>

<style lang="scss">
@import "./assets/layout.scss";
</style>

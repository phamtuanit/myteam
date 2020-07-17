<template>
    <v-content id="main-layout" class="main-view">
        <LeftDrawer></LeftDrawer>
        <RouterView :key="$route.name" />
    </v-content>
</template>

<script>
import LeftDrawer from "../components/drawer/left-drawer";
import RouterView from "../components/router-view/keep-alive-view.vue";

import { mapState } from "vuex";

const BASE_WEB_TITLE = "My Team";
export default {
    components: { LeftDrawer, RouterView },
    data() {
        return {};
    },
    computed: {
        ...mapState({
            chatUnread: state => state.conversations.chat.unread,
            channelUread: state => state.conversations.channel.unread,
        }),
    },
    watch: {
        chatUnread() {
            this.updateTitle();
        },
        channelUread() {
            this.updateTitle();
        },
    },
    mounted() {
        this.me = this.$store.state.users.me;
        this.notification = window.IoC.get("notification");

        const eventBus = window.IoC.get("bus");
        eventBus.on("messages", this.onNewMessage);

        this.updateTitle();
    },
    methods: {
        updateTitle() {
            if (this.chatUnread.length > 0 || this.channelUread.length > 0) {
                // Update website title
                document.title = `${BASE_WEB_TITLE} \ud83d\udc8c You have new message`;
            } else {
                document.title = BASE_WEB_TITLE;
            }
        },
        onNewMessage(act, conv, message) {
            const me = this.me;
            if (!message.from || me.id == message.from.issuer) {
                return;
            }

            switch (act) {
                case "added":
                    {
                        // Notify to user vie Notification API
                        let notifyBody = "Non-html message";
                        if (
                            message.body.type == "" ||
                            message.body.type == "html"
                        ) {
                            // Convert raw html to text
                            let html = message.body.content;
                            html = html
                                .replace(/<img/g, "<span")
                                .replace(/<\/img/g, "</span");
                            const el = document.createElement("div");
                            el.innerHTML = html;
                            notifyBody = el.innerText;
                        }

                        const userId = message.from.issuer;
                        this.$store
                            .dispatch("users/resolve", [userId])
                            .then(users => {
                                let userName = userId;
                                if (Array.isArray(users) && users.length > 0) {
                                    userName = users[0].fullName || userName;
                                }
                                let notifyTitle = `New message from ${userName}`;

                                if (conv.channel == true) {
                                    notifyTitle =
                                        `#${conv.name} \u2022 ` + notifyTitle;
                                }
                                const notification = this.notification.notify(
                                    notifyTitle,
                                    notifyBody,
                                    null,
                                    {
                                        id: message.id,
                                        from: message.from,
                                        to: message.to,
                                    }
                                );
                                notification.onOpen = (evt, msg) => {
                                    const { to } = msg;
                                    if (to && to.conversation) {
                                        this.$store
                                            .dispatch(
                                                "conversations/activeChat",
                                                to.conversation
                                            )
                                            .then(conv => {
                                                const route = this.$route;
                                                if (
                                                    conv.channel == true &&
                                                    route.name !== "app-channel"
                                                ) {
                                                    this.$router.push({
                                                        name: "app-channel",
                                                    });
                                                } else if (
                                                    conv.channel == false &&
                                                    route.name !== "app-chat"
                                                ) {
                                                    this.$router.push({
                                                        name: "app-chat",
                                                    });
                                                }
                                            })
                                            .catch(console.error);
                                    }
                                };
                            });
                    }
                    break;

                default:
                    break;
            }
        },
    },
};
</script>

<style lang="css">
@import "../assets/hightlight.css";
</style>

<style>
#main-layout >>> .v-navigation-drawer .v-navigation-drawer__border {
    background-color: transparent !important;
    width: 0px;
}
</style>

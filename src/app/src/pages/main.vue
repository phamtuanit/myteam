<template>
    <v-main id="main-layout" class="main-view">
        <LeftDrawer></LeftDrawer>
        <RouterView :key="$route.name" />
    </v-main>
</template>

<script>
import LeftDrawer from "../components/drawer/left-drawer";
import RouterView from "../components/router-view/keep-alive-view.vue";

import { mapState } from "vuex";

const BASE_WEB_TITLE = "My Team";
const IMAGE_ZOOM_MODAL_TEMPLATE = `
        <div class="image-modal">
            <!-- The Close Button -->
            <span class="image-modal_close">&times;</span>

            <!-- Modal Content (The Image) -->
            <img class="image-modal_content"/>
        </div>
`;
export default {
    components: { LeftDrawer, RouterView },
    data() {
        return {};
    },
    computed: {
        ...mapState({
            chatUnread: state => state.conversations.chat.unread,
            channelUread: state => state.conversations.channel.unread,
            me: state => state.users.me,
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
    created() {
        this.eventBus = window.IoC.get("bus");
        this.setupZoomModal();
    },
    mounted() {
        this.notification = window.IoC.get("notification");
        // Listen message from server to update title
        this.eventBus.on("messages", this.onNewMessage);
        // Listen socket connection failed
        this.eventBus.on("server:unauthenticated", this.onWSUnauthenticated);
        // Listen server request
        this.eventBus.on("server:incompatible", this.onReloadApp);

        this.updateTitle();
    },
    destroyed() {
        this.eventBus.off("messages", this.onNewMessage);
        this.eventBus.off("server:unauthenticated", this.onWSUnauthenticated);
        this.eventBus.off("server:incompatible", this.onReloadApp);

        if (this.imgZoomModal) {
            document.body.removeEventListener("keyup", this.onDocumentKeyup);
        }
    },
    methods: {
        updateTitle() {
            if (this.chatUnread.length > 0 || this.channelUread.length > 0) {
                // Update website title
                document.title = `${BASE_WEB_TITLE} \ud83d\udc8c New messages`;
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
                                let notifyTitle = `A message from ${userName}`;

                                if (conv.channel == true) {
                                    let subMsg = `a message from ${userName}`;
                                    if (message.mentions && message.mentions.includes(this.me.id)) {
                                        subMsg = "you were mentioned";
                                    }
                                    notifyTitle = `#${conv.name} \u2022 ${subMsg}`;
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
        onWSUnauthenticated() {
            if (this.$route.name == "login") {
                return;
            }

            const auth = window.IoC.get("auth");
            auth.verifyToken()
                .then(() => {
                    window.IoC.get("socket").connect();
                })
                .catch(() => {
                    console.warn("Could not verify token");
                    location.reload();
                });
        },
        onReloadApp() {
            location.reload();
        },
        setupZoomModal() {
            const modals = document.body.getElementsByClassName("image-modal");
            if (modals.length > 0) {
                this.imgZoomModal = modals[0];
            } else {
                const el = document.createElement("div");
                el.innerHTML = IMAGE_ZOOM_MODAL_TEMPLATE;
                this.imgZoomModal = el.firstElementChild;
                document.body.appendChild(this.imgZoomModal);
            }
            document.body.addEventListener("keyup", this.onDocumentKeyup);

            // Get the <span> element that closes the modal
            const closeBtn = this.imgZoomModal.getElementsByClassName("image-modal_close")[0];

            // When the user clicks on <span> (x), close the modal
            closeBtn.onclick = () => {
                this.imgZoomModal.style.display = "none";
            };
        },
        onDocumentKeyup(e) {
            const modal = this.imgZoomModal;
            if ((e.key === "Escape" || e.keyCode == 27) && modal.style.display && modal.style.display !== "none") {
                modal.style.display = "none";
                e.stopPropagation();
            }
        },
    },
};
</script>

<style lang="css">
@import "../assets/hightlight.css";
</style>

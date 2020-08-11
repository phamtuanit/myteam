<template>
    <div class="message-item search-message-item">
        <div class="d-flex flex-row py-2">
            <UserAvatar :user="user" class="align-self-start mt-1" />
            <div class="flex-grow-1 align-self-stretch ml-3">
                <!-- Header -->
                <div class="header center-y selection-disabled">
                    <span class="user-name subtitle-2" v-text="userName"></span>
                    <!-- Time -->
                    <span class="caption" v-text="time"></span>
                    <v-spacer></v-spacer>

                    <v-btn
                        fab
                        class="mr-2"
                        rounded
                        icon
                        height="26"
                        width="26"
                        title="Jump"
                        @click="onJump"
                    >
                        <v-icon small class="action btn-jump"
                            >mdi-ray-end-arrow</v-icon
                        >
                    </v-btn>
                </div>

                <!-- Content -->
                <v-card-text
                    class="pa-0 message-text hl"
                    v-html="messageHtml"
                ></v-card-text>
            </div>
        </div>
    </div>
</template>

<script>
import UserAvatar from "../../components/avatar/user-avatar.vue";
import mixin from "../../mixin/img-zoom.mix.js";
export default {
    components: { UserAvatar },
    mixins: [mixin],
    props: {
        message: {
            type: Object,
            default: () => ({}),
        },
    },
    data() {
        return {
            user: {
                fullName: "Unknown",
            },
            time: "",
            userName: "",
            messageHtml: "",
        };
    },
    created() {
        this.time = this.getDateTime();
        this.messageHtml = this.getMessageHtml();
        if (this.message.issuer) {
            this.$store
                .dispatch("users/resolve", this.message.issuer)
                .then(user => {
                    this.user = user;
                    this.userName = this.getDisplayUserName();
                })
                .catch(console.error);
        }
    },
    methods: {
        onUnpin() {
            this.$store
                .dispatch("conversations/pinMessage", { message: this.message })
                .catch(console.error);
        },
        onJump() {
            this.$emit("jump", this.message);
        },
        getDisplayUserName() {
            const me = this.$store.state.users.me;
            if (me.id === this.user.id) {
                return "Me";
            }

            return (
                this.user.fullName ||
                this.user.firstName + ", " + this.user.lastName
            );
        },
        getMessageHtml() {
            let html = this.message.body.html || this.message.body.text;
            const foundHtmls = this.message._highlight["body.html"];
            foundHtmls.forEach(foundHtml => {
                let foundStr = foundHtml.replace(new RegExp("<em>|</em>", "g"), "");
                html = html.replace(foundStr, foundHtml);
            });

            return html;
        },
        getDateTime() {
            const date = this.message.created;
            if (date) {
                const day = new Date(date);
                return (
                    day.toLocaleDateString() +
                    " " +
                    day.getHours() +
                    ":" +
                    day.getMinutes()
                );
            }

            return "N/A";
        },
    },
};
</script>

<style>
.search-message-item .message-text > p {
    margin-bottom: 0;
}

.search-message-item .theme--light .message-text {
    color: rgba(0, 0, 0, 0.8);
}

.search-message-item .theme--dark .message-text {
    color: rgba(255, 255, 255, 0.7);
}

.search-message-item .user-name::after {
    content: "\2022";
    padding-left: 5px;
    padding-right: 5px;
    color: hsl(0, 0%, 72%);
}

.search-message-item .action {
    opacity: 0.2;
}

.search-message-item:hover .action {
    opacity: 1;
}
</style>

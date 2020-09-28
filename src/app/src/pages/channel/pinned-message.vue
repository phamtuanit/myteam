<template>
    <div class="message-item pinned-message-item">
        <div class="d-flex flex-row py-2">
            <UserAvatar :user="user" class="align-self-start mt-1" />
            <div class="flex-grow-1 align-self-stretch ml-3">
                <!-- Header -->
                <div class="header center-y selection-disabled">
                    <span class="user-name subtitle-2" v-text="userName"></span>
                    <!-- Time -->
                    <span class="caption" v-text="time"></span>
                    <v-spacer></v-spacer>

                    <!-- <v-btn
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
                    </v-btn> -->
                    <v-btn
                        fab
                        class="mr-0"
                        rounded
                        icon
                        height="26"
                        width="26"
                        @click="onUnpin()"
                        v-if="message.pinnedByMe == true"
                    >
                        <v-icon class="action btn-more">mdi-minus</v-icon>
                    </v-btn>
                    <v-menu left>
                        <template v-slot:activator="{ on }">
                            <v-btn icon small v-on="on" class="action ml-1 mr-0">
                                <v-icon small>mdi-dots-vertical</v-icon>
                            </v-btn>
                        </template>
                        <v-list class="menus">
                            <v-list-item @click="onQuote">
                                <v-list-item-title>Quote</v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="onCopy">
                                <v-list-item-title>Copy</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-menu>
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
        if (this.message.from.issuer) {
            this.$store
                .dispatch("users/resolve", this.message.from.issuer)
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
        onQuote() {
            this.$emit("quote", this.message);
        },
        onCopy() {
            this.$emit("copy", this.message);
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
            return this.message.body.content;
        },
        getDateTime() {
            const date = this.message.updated || this.message.created;
            if (date) {
                return new Date(date).toLocaleDateString();
            }

            return "";
        },
    },
};
</script>

<style>
.pinned-message-item .message-text > p {
    margin-bottom: 0;
}

.pinned-message-item .theme--light .message-text {
    color: rgba(0, 0, 0, 0.8);
}

.pinned-message-item .theme--dark .message-text {
    color: rgba(255, 255, 255, 0.7);
}

.pinned-message-item .user-name::after {
    content: "\2022";
    padding-left: 5px;
    padding-right: 5px;
    color: hsl(0, 0%, 72%);
}

.pinned-message-item .action {
    opacity: 0.2;
}

.pinned-message-item:hover .action {
    opacity: 1;
}
</style>

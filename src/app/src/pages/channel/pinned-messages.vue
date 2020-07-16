<template>
    <div class="pinned-message-list fill-height d-flex flex-column">
        <!-- Search -->
        <v-sheet class="pa-0 center-y no-border-radius">
            <v-subheader class="ml-0 selection-disabled"
                >Pinned messages
            </v-subheader>
            <v-spacer></v-spacer>
            <v-btn
                fab
                class="mr-3 btn-refresh"
                rounded
                icon
                height="26"
                width="26"
                title="Refresh"
                @click="onRefresh"
            >
                <v-icon>mdi-refresh</v-icon>
            </v-btn>
        </v-sheet>
        <v-progress-linear
            :active="loading"
            :indeterminate="true"
        ></v-progress-linear>

        <!-- Messages -->
        <v-list class="py-0 px-0">
            <div class="friend-list-layout overflow-y-auto">
                <template v-for="msg in messages">
                    <div
                        :key="msg.id"
                        class="px-4 message-element"
                        :value="msg.id"
                    >
                        <v-divider></v-divider>
                        <div class="d-flex flex-row py-2">
                            <UserAvatar
                                v-if="typeof msg.from.issuer === 'object'"
                                :user-name="msg.from.issuer.fullName"
                                :user="msg.from.issuer"
                                class="align-self-start mt-1"
                            />
                            <div class="flex-grow-1 align-self-stretch ml-3">
                                <!-- Header -->
                                <div class="header center-y selection-disabled">
                                    <span
                                        class="user-name subtitle-2"
                                        v-if="
                                            typeof msg.from.issuer === 'object'
                                        "
                                        v-text="
                                            getDisplayUserName(msg.from.issuer)
                                        "
                                    ></span>
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
                                    <v-btn
                                        fab
                                        class="mr-1"
                                        rounded
                                        icon
                                        height="26"
                                        width="26"
                                        title="Unpin"
                                        @click="onUnpin(msg)"
                                        v-if="msg.pinnedByMe == true"
                                    >
                                        <v-icon class="action btn-unpin"
                                            >mdi-minus</v-icon
                                        >
                                    </v-btn>
                                </div>
                                <!-- Time -->
                                <small
                                    v-text="getDateTime(msg.created)"
                                ></small>

                                <!-- Content -->
                                <v-card-text
                                    class="pa-0 message-text"
                                    v-html="getMessageHtml(msg)"
                                ></v-card-text>
                            </div>
                        </div>
                    </div>
                </template>
            </div>
        </v-list>
    </div>
</template>

<script>
import { fillHeight } from "../../utils/layout.js";
import { mapState } from "vuex";
import UserAvatar from "../../components/avatar/user-avatar.vue";
export default {
    components: { UserAvatar },
    props: {
        conversation: {
            type: Object,
            default: () => ({}),
        },
    },
    data() {
        return {
            loading: false,
            messages: [],
        };
    },
    computed: {
        ...mapState({
            cachedUsers: state => state.users.all,
        }),
    },
    created() {
        this.onRefresh();
    },
    mounted() {
        fillHeight("friend-list-layout", 0, this.$el);
        this.friendList = this.cachedUsers;
    },
    destroyed() {
        this.conversation.pinnedMessages.splice(0);
    },
    methods: {
        onUnpin(message) {
            this.$store
                .dispatch("conversations/pinMessage", { message })
                .catch(console.error);
        },
        onJump(msg) {
            this.$emit("jump", msg);
        },
        onRefresh() {
            return this.$store
                .dispatch("conversations/getPinnedMessage", {
                    convId: this.conversation.id,
                })
                .then(() => {
                    this.messages = this.conversation.pinnedMessages;
                })
                .catch(console.error);
        },
        getDisplayUserName(user) {
            return user.fullName || user.firstName + ", " + user.lastName;
        },
        getMessageHtml(msg) {
            return msg.body.content;
        },
        getDateTime(date) {
            return new Date(date).toLocaleString().substring(0, 16);
        },
    },
};
</script>

<style scoped>
#friend-list {
    width: 250px;
}

#friend-list >>> .v-text-field.v-text-field--solo .v-input__control {
    min-height: 36px !important;
    border: 1px solid rgba(0, 0, 0, 0.12);
}

#friend-list >>> .theme--dark.v-text-field--solo .v-input__control {
    border: 1px solid rgba(255, 255, 255, 0.12);
}

#friend-list >>> .v-list-item {
    min-height: 48px;
}

/* Scroll */
.friend-list-layout > div {
    width: 100%;
}

.v-list-item__content {
    max-width: 218px;
}
</style>
<style scoped>
.pinned-message-list {
    max-width: 500px;
    width: 350px;
}

.theme--light .message-text {
    color: rgba(0, 0, 0, 0.8);
}

.theme--dark .message-text {
    color: rgba(255, 255, 255, 0.7);
}

.pinned-message-list >>> .message-text > p {
    margin-bottom: 0;
}

.user-name::after {
    content: "\2022";
    padding-left: 5px;
    padding-right: 5px;
    color: hsl(0, 0%, 72%);
}

.btn-refresh {
    opacity: 0.4;
}

.btn-refresh:hover {
    opacity: 1;
}

.action {
    opacity: 0.2;
}

.message-element:hover .action {
    opacity: 1;
}
</style>

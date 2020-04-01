<template>
    <div
        class="conversation-item"
        @click="onOpenConv"
        :class="{
            'has-new-message': hasNewMessage,
            'theme--dark': $vuetify.theme.isDark,
        }"
    >
        <UserAvatar :user="targetUser" :infinity="hasNewMessage" />

        <v-list-item-content class="py-1 px-2 content__text">
            <v-list-item-title
                class="subtitle-2 mb-0"
                v-text="conversation.name"
            ></v-list-item-title>
            <v-list-item-subtitle
                v-if="recentMessage"
                class="caption"
                :class="{ 'font-weight-bold': hasNewMessage }"
                v-text="recentMessage"
            ></v-list-item-subtitle>
        </v-list-item-content>
    </div>
</template>

<script>
import { mapState } from "vuex";
import UserAvatar from "./user-avatar.vue";
export default {
    props: ["conversation"],
    components: { UserAvatar },
    data: vm => ({
        recentMessage: "",
        messages: vm.conversation.messages,
        unreadMessage: vm.conversation.meta.unreadMessage,
    }),
    computed: {
        ...mapState({
            activatedChat: state => state.chats.active,
        }),
        enableOnlineEffect() {
            return (
                this.activatedChat &&
                this.activatedChat.id == this.conversation.id &&
                this.targetUser.status == "on"
            );
        },
        targetUser() {
            if (this.conversation) {
                const friends = this.conversation.subscribers.filter(
                    user => !user._isMe
                );
                if (friends.length > 0) {
                    return friends[0];
                }
            }
            // Dummy data
            return {};
        },
        hasNewMessage() {
            return this.unreadMessage.length > 0;
        },
    },
    watch: {
        messages() {
            this.updateRecentMessage();
        },
    },
    mounted() {
        this.updateRecentMessage();
    },
    methods: {
        updateRecentMessage() {
            const recentMsg = this.getRecentMessage();

            if (recentMsg) {
                const msgType = recentMsg.body.type || "html";
                switch (msgType) {
                    case "html":
                        this.recentMessage = recentMsg.body.content;
                        break;

                    default:
                        break;
                }
            }
        },
        getRecentMessage() {
            if (
                !this.conversation.messages ||
                this.conversation.messages.length <= 0
            ) {
                return null;
            }

            return this.conversation.messages[
                this.conversation.messages.length - 1
            ];
        },
        onOpenConv() {
            if (this.conversation.meta.unreadMessage.length > 0) {
                this.$store
                    .dispatch("chats/watchAllMessage", this.conversation.id)
                    .catch(console.error);
            }
        },
    },
};
</script>

<style scoped>
.conversation-item {
    display: flex;
    align-items: center;
    -webkit-box-align: center;
    -webkit-box-flex: 1;
    flex: 1 1 100%;
    text-decoration: none;
    outline: none;
}

.has-new-message {
    position: relative;
}

.has-new-message::after {
    animation: opacity 0.2s linear;
    content: "";
    position: absolute;
    background-color: var(--primary-color-2);
    width: 3px;
    left: -16px;
    bottom: -7px;
    top: -7px;
}

.has-new-message::after {
    background-color: var(--primary-color-2);
}

.theme--dark.has-new-message::after {
    background-color: var(--primary-color--text);
}

@keyframes opacity {
    0% {
        opacity: 0;
    }
    100% {
        opacity: 1;
    }
}

.content__text {
    max-width: 218px;
}
</style>

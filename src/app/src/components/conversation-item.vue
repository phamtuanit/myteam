<template>
    <div class="conversation-item" @click="onOpenConv">
        <UserAvatar :user="targetUser" :infinity="hasNewMessage" />

        <v-list-item-content
            class="py-2 pl-3 pr-2"
        >
            <v-list-item-title
                class="body-2"
                v-text="conversationName"
            ></v-list-item-title>
            <v-list-item-subtitle
            class="caption"
                :class="{'font-weight-black': hasNewMessage }"
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
        recentMessage: "...",
        messages: vm.conversation.messages,
        hasNewMessage: true,
    }),
    computed: {
        ...mapState({
            activatedChat: state => state.chats.active,
        }),
        conversationName() {
            if (this.conversation.name) {
                return this.conversation.name;
            }

            const friends = this.conversation.subscribers
                .filter(user => !user._isMe)
                .map(user => {
                    return (
                        user.fullName || user.firstName + ", " + user.lastName
                    );
                });
            return friends.join(", ");
        },
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
    },
    watch: {
        messages() {
            this.updateRecentMessage();
            this.checkNewMessage();
        },
    },
    mounted() {
        this.updateRecentMessage();
        this.checkNewMessage();
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
        checkNewMessage() {
            const recentMsg = this.getRecentMessage();
            this.hasNewMessage = recentMsg ? !recentMsg.seen : false;
        },
        onOpenConv() {
            if (this.conversation.messages) {
                this.$store.dispatch(
                    "chats/watchAllMessage",
                    this.conversation.id
                ).then(conv => {
                    this.hasNewMessage = conv != null && conv != undefined;
                }).catch(console.error);
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
    text-decoration: none;
    outline: none;
}
</style>

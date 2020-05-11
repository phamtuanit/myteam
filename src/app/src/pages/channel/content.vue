<template>
    <div class="conversation-content pa-0 ma-0 d-flex flex-column">
        <!-- Content -->
        <v-sheet
            class="message-sheet flex-grow-1 overflow-y-auto no-border-radius transparent mb-1"
            v-chat-scroll="{ always: false, smooth: true }"
            @click="onRead"
            ref="messageFeed"
        >
            <Loading
                :load="loadMore"
                :reached-end="conversation.reachedFullHistories"
                class="conversation-loading"
            ></Loading>

            <!-- Message -->
            <Message
                v-for="msg in messages"
                :key="msg.id"
                :message="msg"
                @react="onReact"
                @dereact="onDereact"
                @delete="onDeleteMessage"
                @quote="onQuote"
            >
                <!-- Separator -->
                <v-divider class="message-item__content-separator mx-3"></v-divider>
            </Message>
        </v-sheet>

        <Notification
            class="notification"
            :read-more="allowReadMore"
            @read-more="onReadMore"
        />

        <!-- Input -->
        <ChatEditor
            class="channel_input mt-2 mb-1"
            v-model="newMessage"
            :id="conversation.id"
            :mention="mention"
            @send="onSendMessage"
        ></ChatEditor>
    </div>
</template>

<script>
import ChatEditor from "../../components/editor/chat-editor.vue";
import Loading from "../../components/infinity-scroll-top.vue";
import Message from "./message.vue";
import Notification from "../shared/conversation-notification.vue";
import { mapState } from "vuex";
import mixin from "../mixin/conversation-content.mix.js";
export default {
    props: {
        conversation: Object,
    },
    components: { ChatEditor, Message, Loading, Notification },
    mixins: [mixin],
    data() {
        return {
            mention: {
                feeds: [
                    {
                        marker: "@",
                        minimumCharacters: 1,
                        feed: this.getUsers,
                    },
                ],
            },
        };
    },
    computed: {
        ...mapState({
            cachedUsers: state => state.users.all,
        }),
    },
    methods: {
        onSendMessage(html) {
            this.onRead();
            if (!html) {
                return;
            }

            const convId = this.conversation.id;
            // Send message
            const msg = {
                convId: convId,
                body: {
                    content: html,
                },
            };
            this.$store
                .dispatch("conversations/sendMessage", msg)
                .then(() => {
                    this.newMessage = "";
                    setTimeout(this.scrollToBottom, 10);
                })
                .catch(console.error);
        },
        getUsers(queryText) {
            if (queryText.toLowerCase() == "all") {
                return [
                    {
                        id: "@All",
                        userId: "all-user",
                        name: "All",
                    },
                ];
            }

            const found = this.conversation.subscribers.filter(
                u =>
                    u.userName.includes(queryText) ||
                    u.fullName.includes(queryText)
            );

            if (found && found.length > 0) {
                return found.map(u => {
                    const item = { ...u };
                    item.id = "@" + (u.fullName || u.userName);
                    item.userId = u.id;
                    item.name = u.fullName || u.userName;
                    return item;
                });
            }
            return [];
        },
    },
};
</script>

<style lang="css" scoped>
.conversation-content {
    height: calc(100vh - 58px);
    width: 100%;
}

.conversation-content >>> .notification,
.channel_input {
    margin-left: 60px;
    margin-right: 58px;
}
</style>

<style lang="css">
.channel-message-item:first-of-type .message-item__content-separator,
.conversation-loading + .channel-message-item .message-item__content-separator
 {
    display: none;
}

.channel-message-item:first-of-type,
.conversation-loading + .channel-message-item {
    margin-top: 8px;
}

.channel-message-item:last-of-type {
    margin-bottom: 8px;
}

.message-item__content--card {
    border-radius: 0 !important;
}

.channel-message-item:first-of-type .message-item__content--card,
.conversation-loading + .channel-message-item .message-item__content--card {
    border-radius: 3px 3px 0 0 !important;
}

.channel-message-item:last-of-type .message-item__content--card {
    border-radius: 0 0 3px 3px !important;
}

.channel-message-item:first-of-type .message-item__content--card::after,
.conversation-loading + .channel-message-item .message-item__content--card::after {
    border-radius: 0 3px 0 0 !important;
}

.channel-message-item:last-of-type .message-item__content--card::after {
    border-radius: 0 0 3px 0 !important;
}
</style>

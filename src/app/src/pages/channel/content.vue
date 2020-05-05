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

        <!-- Input -->
        <ChatEditor
            class="channel__input mt-2 mb-1"
            v-model="newMessage"
            :id="conversation.id"
            :mention="mention"
            @enter="onSend"
            @send="onSend"
        ></ChatEditor>
    </div>
</template>

<script>
import ChatEditor from "../../components/editor/chat-editor.vue";
import Loading from "../../components/infinity-scroll-top.vue";
import Message from "./message.vue";
import { mapState } from "vuex";
import { scrollToBottom } from "../../utils/layout.js";
export default {
    props: {
        conversation: Object,
    },
    components: { ChatEditor, Message, Loading },
    data() {
        return {
            loadMore: this.onLoadMore,
            newMessage: null,
            messages: [],
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
    created() {
        this.messages = this.conversation.messages;
    },
    methods: {
        onRead() {
            const conv = this.conversation;
            if (conv && conv.meta.unreadMessages.length > 0) {
                this.$store
                    .dispatch("conversations/watchAllMessage", conv.id)
                    .catch(console.error);
            }
        },
        onSend(html) {
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
        onReact(type, message, status = true) {
            this.$store
                .dispatch("conversations/reactMessage", {
                    type,
                    message,
                    status,
                })
                .then(msg => {
                    message.reactions = msg.reactions;
                })
                .catch(console.error);
        },
        onDereact(type, message) {
            this.onReact(type, message, false);
        },
        onDeleteMessage(message) {
            this.$store
                .dispatch("conversations/deleteMessage", message)
                .catch(console.error);
        },
        onQuote(message) {
            this.onRead();
            if (
                !message ||
                !message.body.content ||
                (message.body.type != null && message.body.type != "html")
            ) {
                return;
            }

            console.log("Quote: ", message.id);
            this.newMessage = `<blockquote>${message.body.content}</blockquote><p></p>`;
        },
        onLoadMore() {
            return this.$store
                .dispatch("conversations/getConversationContent", {
                    convId: this.conversation.id,
                })
                .catch(console.error);
        },
        scrollToBottom() {
            const msgSheetEl = this.$refs.messageFeed.$el;
            scrollToBottom(msgSheetEl);
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

.channel__input {
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

.channel-message-item:first-of-type,
.conversation-loading + .channel-message-item .message-item__content--card {
    border-radius: 3px 3px 0 0 !important;
}

.channel-message-item:last-of-type .message-item__content--card {
    border-radius: 0 0 3px 3px !important;
}

.channel-message-item:first-of-type,
.conversation-loading + .channel-message-item .message-item__content--card::after {
    border-radius: 0 3px 0 0 !important;
}

.channel-message-item:last-of-type .message-item__content--card::after {
    border-radius: 0 0 3px 0 !important;
}
</style>

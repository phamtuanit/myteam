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
                v-if="messages && messages.length > 0 && !conversation.reachedFullHistories"
                class="conversation-loading"
            ></Loading>

            <!-- Message -->
            <Message
                v-for="(msg, index) in messages"
                :key="msg.id"
                :index="index"
                :message="msg"
                @react="onReact"
                @dereact="onDereact"
                @delete="onDeleteMessage"
                @quote="onQuote"
                @copy="onCopy"
                @edit="onEditMessage"
                @pin="onPin"
            >
                <!-- Separator -->
                <v-divider
                    class="message-item__content-separator mx-3"
                ></v-divider>
            </Message>
        </v-sheet>

        <Notification
            class="notification"
            :read-more="hasUnreadMessages"
            :editing="editingMessage != null"
            @read-more="loadUnreadMessages"
            @edit:locate="onLocateEditingMessage"
            @edit:cancel="onCancelEditingMessage"
        />

        <!-- Input -->
        <ChatEditor
            class="channel_input mt-2 mb-1"
            v-model="newMessage"
            :id="conversation.id"
            :mention="mention"
            :sending="sending"
            placeholder="Start a new conversation. Type @ to mention someone."
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
            sending: false,
            editingMessage: null,
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
            me: state => state.users.me,
        }),
    },
    mounted() {
        this.$on("quote", this.onQuote);
        this.$on("copy", this.onCopy);
    },
    methods: {
        onSendMessage(html) {
            this.onRead();
            if (!html || this.sending == true) {
                return;
            }

            if (this.editingMessage) {
                // Update message content
                this.updateMessage(html);
            } else {
                // Send new message
                this.sendMessage(html);
            }
        },
        onEditMessage(message) {
            if (this.editingMessage) {
                this.editingMessage.status = "";
            }

            this.editingMessage = message;
            this.editingMessage.status = "editing";
            this.newMessage = this.editingMessage.body.content;
        },
        onLocateEditingMessage() {
            if (this.editingMessage) {
                const mesgId = this.editingMessage.id;
                const containerEl = this.$refs.messageFeed.$el;
                const msgEl = containerEl.querySelector(
                    `.message-item[data-message-id="${mesgId}"]`
                );
                if (msgEl) {
                    msgEl.scrollIntoView({
                        behavior: "smooth",
                        block: "nearest",
                        inline: "nearest",
                    });
                }
            }
        },
        onCancelEditingMessage() {
            if (this.editingMessage) {
                this.editingMessage.status = "";
                this.editingMessage = null;
                this.newMessage = "";
            }
        },
        onPin(message) {
            this.$store
                .dispatch("conversations/pinMessage", { message })
                .catch(console.error);
        },
        updateMessage(html) {
            const convId = this.conversation.id;
            const originalMsg = this.editingMessage;
            // Send message
            const msg = {
                convId: convId,
                id: originalMsg.id,
                body: {
                    content: html,
                },
            };

            this.sending = true;
            this.$store
                .dispatch("conversations/updateMessage", msg)
                .then(() => {
                    // Scroll to message item
                    this.onLocateEditingMessage();
                    // Reset editing state
                    this.onCancelEditingMessage();
                })
                .catch(console.error)
                .finally(() => {
                    this.sending = false;
                });
        },
        sendMessage(html) {
            html = html.trim().replace("<p>&nbsp;</p>", "");
            const convId = this.conversation.id;
            // Send message
            const msg = {
                convId: convId,
                body: {
                    content: html,
                },
            };

            this.sending = true;
            this.$store
                .dispatch("conversations/sendMessage", msg)
                .then(() => {
                    this.newMessage = "";
                    setTimeout(this.scrollToBottom, 10);
                })
                .catch(console.error)
                .finally(() => {
                    this.sending = false;
                });
        },
        getUsers(queryText) {
            if (queryText.toLowerCase() == "all") {
                return [
                    {
                        id: "@All",
                        userId: "all-users",
                        name: "All",
                    },
                ];
            }

            const found = this.conversation.subscribers.filter(u => {
                return (
                    (u.userName && u.userName.includes(queryText)) ||
                    (u.fullName && u.fullName.includes(queryText))
                );
            });

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

<style lang="css">
.conversation-content {
    height: 100%;
    width: 100%;
}

.conversation-content .notification,
.conversation-content .channel_input {
    margin-left: 60px;
    margin-right: 58px;
}

.channel-message-item:first-of-type .message-item__content-separator,
.conversation-loading + .channel-message-item .message-item__content-separator {
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
.conversation-loading
    + .channel-message-item
    .message-item__content--card::after {
    border-radius: 0 3px 0 0 !important;
}

.channel-message-item:last-of-type .message-item__content--card::after {
    border-radius: 0 0 3px 0 !important;
}
</style>

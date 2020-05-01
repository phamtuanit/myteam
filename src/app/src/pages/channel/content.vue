<template>
    <div class="conversation-content pa-0 ma-0 d-flex flex-column">
        <!-- Content -->
        <v-sheet
            class="message-sheet flex-grow-1 overflow-y-auto no-border-radius transparent mb-2"
            v-chat-scroll="{ always: false, smooth: true }"
            @click="onRead"
            ref="messageSheet"
        >
            <!-- MineMessage -->
            <v-slide-y-transition group>
                <Message
                    v-for="msg in messages"
                    :key="msg.id"
                    :message="msg"
                    @react="onReact"
                    @dereact="onDereact"
                    @delete="onDeleteMessage"
                    @edit="onEditMessage"
                >
                    <v-divider class="message-item__content-separator mx-3"></v-divider>
                </Message>
            </v-slide-y-transition>
        </v-sheet>

        <!-- Input -->
        <ChatEditor
            class="channel__input mt-2 mb-1"
            v-model="newMessage"
            :id="conversation.id"
            @enter="onSend"
            @send="onSend"
            @ready="onChatEditorReady"
        ></ChatEditor>
    </div>
</template>

<script>
import ChatEditor from "../../components/editor/chat-editor.vue";
import Message from "./message.vue";
export default {
    props: {
        conversation: Object,
    },
    components: { ChatEditor, Message },
    data() {
        return {
            newMessage: null,
            messages: [],
        };
    },
    created() {
        this.messages = this.conversation.messages;
    },
    methods: {
        onChatEditorReady() {
            this.scrollToBottom();
        },
        onRead() {
            const conv = this.conversation;
            if (conv && conv.meta.unreadMessage.length > 0) {
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
        onEditMessage() {},
        scrollToBottom() {
            const msgSheetEl = this.$refs.messageSheet.$el;
            msgSheetEl.scrollTop = msgSheetEl.scrollHeight;
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
.channel-message-item:first-of-type .message-item__content-separator {
    display: none;
}

.channel-message-item:first-of-type {
    margin-top: 10px;
}

.channel-message-item:last-of-type {
    margin-bottom: 10px;
}
</style>

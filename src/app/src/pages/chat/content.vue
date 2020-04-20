<template>
    <div class="chat-box d-flex flex-column">
        <!-- Header -->
        <v-sheet
            height="57"
            min-height="57"
            class="pa-0 center-y no-border-radius flex-grow-0"
        >
            <!-- User info -->
            <v-list-item class="px-4 ma-0">
                <Avatar
                    :user-name="conversation.name"
                    :src="destUser.avatar"
                    :size="30"
                    class="ml-2"
                ></Avatar>
                <!-- User name -->
                <v-list-item-title
                    class="title ml-3"
                    v-text="conversation.name"
                ></v-list-item-title>

                <v-spacer></v-spacer>
                <!-- Friends list -->
                <v-tooltip left>
                    <template v-slot:activator="{ on }">
                        <v-btn
                            v-on="on"
                            icon
                            :style="
                                showFrienfList ? 'opacity: 1;' : 'opacity: 0.6;'
                            "
                            @click="showFrienfList = !showFrienfList"
                        >
                            <v-icon v-text="
                                    showFrienfList
                                        ? 'mdi-account-supervisor'
                                        : 'mdi-account-search'
                                "></v-icon>
                        </v-btn>
                    </template>
                    <span>Friend list</span>
                </v-tooltip>
            </v-list-item>
        </v-sheet>
        <v-divider></v-divider>

        <!-- Content -->
        <v-sheet
            class="flex-grow-1 overflow-y-auto message-sheet no-border-radius transparent"
            v-chat-scroll="{ always: false, smooth: true }"
            ref="messageSheet"
            @click="onRead"
        >
            <!-- MineMessage -->
            <v-slide-y-transition group>
                <template v-for="msg in messages">
                    <MyMessage
                        v-if="msg._isMe == true"
                        :key="msg.id"
                        :message="msg"
                        :class="{
                            'has-reacted':
                                msg.reactions && msg.reactions.length > 0,
                        }"
                        @delete="onDeleteMyMessage"
                    ></MyMessage>
                    <YourMessage
                        v-else
                        :user="destUser"
                        :key="msg.id"
                        :message="msg"
                        :class="{
                            'has-reacted':
                                msg.reactions && msg.reactions.length > 0,
                        }"
                        @react="onReact"
                        @dereact="onDereact"
                        @reply="onReply"
                    ></YourMessage>
                </template>
            </v-slide-y-transition>
        </v-sheet>

        <!-- Input box -->
        <ChatEditor
            class="chat-editor mt-2 mb-1"
            v-model="newMessage"
            @enter="onSendMessage"
            @send="onSendMessage"
            @ready="onChatEditorReady"
        ></ChatEditor>
    </div>
</template>

<script>
import EmojiButton from "../../components/emoji-button";
import FriendList from "./friend-list";

import MyMessage from "./my-message";
import YourMessage from "./your-message";
import Avatar from "../../components/avatar";
import ChatEditor from "../../components/editor/chat-editor.vue";

export default {
    components: {
        FriendList,
        EmojiButton,
        MyMessage,
        YourMessage,
        Avatar,
        ChatEditor,
    },
    props: {
        conversation: Object,
    },
    data() {
        return {
            theme: this.$vuetify.theme,
            newMessage: null,
            showFrienfList: true,
            messages: [],
        };
    },
    computed: {
        destUser() {
            if (this.conversation) {
                const subscribers = this.conversation.subscribers.filter(
                    user => !user._isMe
                );
                if (subscribers.length > 0) {
                    return subscribers[0];
                }
            }
            return {};
        },
    },
    watch: {
        showFrienfList(val) {
            this.$emit("show-friend-list", val);
        },
    },
    created() {
        this.bus = window.IoC.get("bus");
        this.chatId = this.conversation._id || this.conversation.id;
        this.messages = this.conversation.messages;
    },
    methods: {
        onChatEditorReady() {
            const msgSheetEl = this.$refs.messageSheet.$el;
            msgSheetEl.scrollTop = msgSheetEl.scrollHeight;
        },
        onSendMessage(html) {
            if (!html) {
                return;
            }

            if (this.conversation._isTemp == true) {
                // Create chat first
                const convInfo = {
                    _id: this.conversation._id,
                    subscribers: this.conversation.subscribers.map(u => u.id),
                };

                return this.$store
                    .dispatch("conversations/createConversation", convInfo)
                    .then(() => {
                        this.onSendMessage();
                    })
                    .catch(console.error);
            }

            this.chatId = this.conversation.id;
            // Send message
            const msg = {
                convId: this.chatId,
                body: {
                    content: html,
                },
            };
            this.$store
                .dispatch("conversations/sendMessage", msg)
                .then(() => {
                    console.log("Reset msg - B: ", this.newMessage);
                    this.newMessage = "";
                    console.log("Reset msg - A: ", this.newMessage);
                })
                .catch(console.error);
        },
        onDeleteMyMessage(message) {
            this.$store
                .dispatch("conversations/deleteMessage", message)
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
        onReply(message) {},
        onRead() {
            const conv = this.conversation;
            if (conv && conv.meta.unreadMessage.length > 0) {
                this.$store
                    .dispatch("conversations/watchAllMessage", conv.id)
                    .catch(console.error);
            }
        },
    },
};
</script>

<style lang="css" scoped>
.chat-box {
    height: 100vh;
}

/* Message aligment */
.message-sheet >>> .message-item:first-of-type {
    margin-top: 8px;
}

.message-sheet >>> .message-item:not(:first-of-type) .message-card__header {
    display: none;
}

.message-sheet >>> .my-message + .your-message .message-card__header,
.message-sheet >>> .your-message + .my-message .message-card__header {
    display: flex;
}

.message-sheet >>> .message-item.has-reacted .message-card__header {
    display: flex;
}

.message-sheet >>> .your-message + .your-message.has-reacted .user-name {
    display: none;
}

.message-sheet >>> .your-message + .my-message {
    margin-top: 16px;
}

.message-sheet >>> .my-message + .your-message {
    margin-top: 16px;
}

.message-sheet >>> div.your-message:last-child {
    margin-bottom: 20px !important;
}

/* Message avatar */
.message-sheet >>> .your-message .v-avatar {
    visibility: hidden;
}
.message-sheet >>> .your-message:first-of-type .v-avatar {
    visibility: inherit;
}

.message-sheet >>> .my-message + .your-message .v-avatar {
    visibility: inherit;
}

/* Message text */
.message-sheet >>> .theme--light.v-card > .v-card__text {
    color: rgba(0, 0, 0, 0.8);
}

/* Message actions */
.message-sheet >>> .message-actions {
    align-items: center;
    opacity: 0;
}

.message-sheet >>> .message-item:hover > .message-actions {
    opacity: 1;
    transition: all 0.2s ease-in;
}

.chat-box >>> .message-content p:last-child {
    margin-bottom: 2px;
}

.chat-box >>> .chat-editor {
    margin-left: 60px;
    margin-right: 14px;
}
</style>

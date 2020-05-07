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
                    class="ml-1"
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
                                friendList ? 'opacity: 1;' : 'opacity: 0.6;'
                            "
                            @click="onShowFriendList"
                        >
                            <v-icon
                                v-text="
                                    friendList
                                        ? 'mdi-account-supervisor'
                                        : 'mdi-account-search'
                                "
                            ></v-icon>
                        </v-btn>
                    </template>
                    <span>Friend list</span>
                </v-tooltip>
            </v-list-item>
        </v-sheet>
        <v-divider></v-divider>

        <!-- Content -->
        <v-sheet
            class="flex-grow-1 overflow-y-auto message-sheet no-border-radius transparent pt-1"
            v-chat-scroll="{ always: false, smooth: true }"
            ref="messageFeed"
            @click="onRead"
        >
            <!-- Loading -->
            <Loading
                :load="loadMore"
                class="conversation-loading"
                :reached-end="conversation.reachedFullHistories"
                v-if="conversation.id"
            ></Loading>
            <!-- Message -->
            <template v-for="msg in messages">
                <MyMessage
                    v-if="msg._isMe == true"
                    :key="msg.id"
                    :message="msg"
                    :class="{
                        'has-reacted':
                            msg.reactions && msg.reactions.length > 0,
                    }"
                    @delete="onDeleteMessage"
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
                    @quote="onQuote"
                ></YourMessage>
            </template>
        </v-sheet>

        <Notification
            class="notification"
            :read-more="allowReadMore"
            @read-more="onReadMore"
        />

        <!-- Input box -->
        <ChatEditor
            class="chat-editor mt-2 mb-1"
            v-model="newMessage"
            :id="conversation.id"
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
import Avatar from "../../components/avatar/avatar.vue";
import ChatEditor from "../../components/editor/chat-editor.vue";
import Loading from "../../components/infinity-scroll-top.vue";
import Notification from "../shared/conversation-notification.vue";

import mixin from "../mixin/conversation-content.mix.js";
export default {
    props: {
        friendList: {
            type: Boolean,
        },
    },
    components: {
        FriendList,
        EmojiButton,
        MyMessage,
        YourMessage,
        Avatar,
        ChatEditor,
        Loading,
        Notification,
    },
    mixins: [mixin],
    data() {
        return {};
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
    created() {
        this.bus = window.IoC.get("bus");
        this.chatId = this.conversation._id || this.conversation.id;
    },
    methods: {
        onShowFriendList() {
            this.$emit("show-friend-list", !this.friendList);
        },
        onSendMessage(html) {
            this.onRead();
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
                    this.newMessage = "";
                    setTimeout(this.scrollToBottom, 10);
                })
                .catch(console.error);
        },
    },
};
</script>

<style lang="css" scoped>
.chat-box {
    height: 100vh;
}

/* Message aligment */
.message-sheet
    >>> .message-item:not(:first-of-type)
    .message-item__content-header {
    display: none;
}

.message-sheet >>> .my-message + .your-message .message-item__content-header,
.message-sheet >>> .your-message + .my-message .message-item__content-header,
.message-sheet
    >>> .conversation-loading
    + .message-item
    .message-item__content-header {
    display: flex;
}

.message-sheet >>> .message-item.has-reacted .message-item__content-header {
    display: flex;
}

.message-sheet >>> .your-message + .your-message.has-reacted .user-name {
    display: none;
}

.message-sheet >>> .your-message + .my-message {
    margin-top: 18px;
}

.message-sheet >>> .my-message + .your-message {
    margin-top: 18px;
}

.message-sheet >>> div.message-item:last-child {
    margin-bottom: 18px !important;
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

/* Message actions */
.message-sheet >>> .message-item__actions {
    align-items: center;
    opacity: 0;
}

.message-sheet >>> .message-item:hover > .message-item__actions {
    opacity: 1;
    transition: all 0.2s ease-in;
}

.message-sheet >>> .message-item .message-item__content--card {
    position: relative;
}

.message-sheet >>> .message-item .message-item__content {
    padding-top: 2px;
    padding-bottom: 2px;
}

.chat-box >>> .notification,
.chat-box >>> .chat-editor {
    margin-left: 60px;
    margin-right: 14px;
}

.message-sheet {
    position: relative;
}
</style>

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
                    :user-name="conversationName"
                    :src="destUser.avatar"
                    :size="30"
                    class="ml-1"
                ></Avatar>
                <!-- User name -->
                <v-list-item-title
                    class="title ml-3"
                    v-text="conversationName"
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
                            <v-icon v-text="
                                    friendList
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
            class="flex-grow-1 overflow-y-auto message-sheet no-border-radius transparent pt-0"
            v-chat-scroll="{ always: false, smooth: true }"
            ref="messageFeed"
            @click="onRead"
        >
            <!-- Loading -->
            <Loading
                :load="loadMore"
                class="conversation-loading"
                v-if="messages && messages.length > 0 && !conversation.reachedFullHistories && conversation.id"
            ></Loading>
            <!-- Messages -->
            <template v-for="(msg, index) in messages">
                <MyMessage
                    v-if="msg._isMe == true"
                    :key="msg.id"
                    :message="msg"
                    :class="{
                        'has-reaction':
                            msg.reactions && msg.reactions.length > 0,
                        'separate-time': !isSamePeriod(index, msg)
                    }"
                    @delete="onDeleteMessage"
                ></MyMessage>
                <YourMessage
                    v-else
                    :user="destUser"
                    :key="msg.id"
                    :message="msg"
                    :class="{
                        'has-reaction':
                            msg.reactions && msg.reactions.length > 0,
                        'separate-time': !isSamePeriod(index, msg)
                    }"
                    @react="onReact"
                    @dereact="onDereact"
                    @quote="onQuote"
                ></YourMessage>
            </template>
        </v-sheet>

        <Notification
            class="notification"
            :read-more="hasUnreadMessages"
            @read-more="loadUnreadMessages"
        />

        <!-- Input box -->
        <ChatEditor
            class="chat-editor mt-2 mb-1"
            v-model="newMessage"
            :id="conversation.id"
            :sending="sending"
            @send="onSendMessage"
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
        return {
            sending: false,
        };
    },
    computed: {
        destUser() {
            if (this.conversation && !this.conversation.channel ) {
                const subscribers = this.conversation.subscribers.filter(
                    user => !user._isMe
                );
                if (subscribers.length > 0) {
                    return subscribers[0];
                }
            }
            return null;
        },
        conversationName() {
            if (this.destUser) {
                return this.destUser.fullName || this.destUser.name || this.destUser.firstName + ', ' + this.destUser.lastName
            }
            return this.conversation.name;
        }
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
            if (!html || this.sending == true) {
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
                        this.onSendMessage(html);
                    })
                    .catch(console.error);
            }

            this.chatId = this.conversation.id;
            // Send message
            const msg = {
                convId: this.chatId,
                body: {
                    content: html,
                    parent_message_ids: this.parentMessageIds,
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
        isSamePeriod(index, message) {
            if (index == 0) {
                // The first message
                return true;
            }

            const previousMsg = this.messages[index - 1];
            if (previousMsg._isMe !== message._isMe) {
                return true;
            }

            const diffMiliseconds = new Date(message.created) - new Date(previousMsg.created);
            return diffMiliseconds / (60 * 1000) < 30; // 30 mins
        },
    },
};
</script>

<style>
.chat-box {
    height: 100vh;
}

.chat-box .notification,
.chat-box .chat-editor {
    margin-left: 60px;
    margin-right: 14px;
}

.chat-box .message-sheet {
    position: relative;
}
</style>

<style lang="css" scoped>
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

.message-sheet >>> .message-item.has-reaction .message-item__content-header {
    display: flex;
}

.message-sheet >>> .message-item.separate-time .message-item__content-header {
    display: flex;
}

.message-sheet >>> .your-message + .your-message.has-reaction .user-name {
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
</style>

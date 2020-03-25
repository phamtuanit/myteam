<template>
    <div class="chat-box fill-height">
        <v-sheet
            class="overflow-y-auto message-sheet no-border-radius"
            v-chat-scroll="{ always: false, smooth: true }"
        >
            <!-- MineMessage -->
            <template v-for="(msg, index) in messages">
                <MyMessage
                    v-if="msg._isMe == true"
                    :key="msg.id"
                    :index="index"
                    :message="msg"
                    class="mt-4"
                    @delete="onDeleteMyMessage"
                ></MyMessage>
                <YourMessage
                    v-else
                    :user="destUser"
                    :key="msg.id"
                    :index="index"
                    :message="msg"
                    class="mt-4"
                ></YourMessage>
            </template>
        </v-sheet>

        <!-- Input -->
        <v-list height="48" v-show="activatedChat" class="py-0 no-border-radius">
            <v-list-item class="px-0 px-2">
                <EmojiButton @select="onSelectEmoji"></EmojiButton>
                <v-text-field
                    flat
                    class="no-border-radius"
                    v-model="newMessage"
                    hide-details
                    solo
                    clearable
                    @keyup.esc="onClearMessage"
                    @keyup.enter="onSendMessage"
                    clear-icon="mdi-close"
                ></v-text-field>
                <v-btn
                    icon
                    class="send-btn"
                    :disabled="!newMessage"
                    @click="onSendMessage"
                >
                    <v-icon>mdi-send</v-icon>
                </v-btn>
            </v-list-item>
        </v-list>
    </div>
</template>

<script>
import { fillHeight } from "../../utils/layout.js";
import EmojiButton from "../../components/emoji-button";
import MyMessage from "./my-message";
import YourMessage from "./your-message";

import { mapState } from "vuex";
export default {
    components: { EmojiButton, MyMessage, YourMessage },
    data() {
        return {
            theme: this.$vuetify.theme,
            newMessage: "",
            messages: [],
        };
    },
    computed: {
        ...mapState({
            activatedChat: state => state.chats.active,
        }),
        destUser() {
            if (this.activatedChat) {
                const subscribers = this.activatedChat.subscribers.filter(
                    user => !user._isMe
                );
                if (subscribers.length > 0) {
                    return subscribers[0];
                }
            }
            return {};
        },
        chatId() {
            return this.activatedChat ? this.activatedChat.id : -1;
        },
    },
    watch: {
        activatedChat() {
            this.messages = this.activatedChat.messages;
        },
    },
    created() {
        if (this.activatedChat) {
            this.messages = this.activatedChat.messages;
        }
    },
    mounted() {
        fillHeight("message-sheet", 48, this.$el);
    },
    methods: {
        onClearMessage() {
            this.newMessage = "";
        },
        onSelectEmoji(emoji) {
            if (emoji.native) {
                this.newMessage += emoji.native;
            }
        },
        onSendMessage() {
            if (this.status == "temp") {
                // Create new conversation first
                this.$store
                    .dispatch("chats/createChat", this.friendId)
                    .then(conv => {
                        this.chatId = conv.id;
                        this.status = null;
                        this.onSendMessage();
                    })
                    .catch(console.error);
            } else {
                // Send message
                const msg = {
                    chatId: this.chatId,
                    body: {
                        content: this.newMessage,
                    },
                };
                this.$store
                    .dispatch("chats/sendMessage", msg)
                    .then(() => {
                        this.newMessage = "";
                    })
                    .catch(console.error);
            }
        },
        onDeleteMyMessage(message) {
            this.$store.dispatch("chats/deleteMessage", message).catch(console.error);
        },
    },
};
</script>

<style lang="css" scoped>
.chat-box >>> .message-sheet {
    background: rgb(243, 242, 241);
}

.chat-box >>> .message-sheet.theme--dark {
    background: #121212;
}

.chat-box >>> .theme--light.v-btn.v-btn--icon {
    color: var(--primary-color-2);
}

/* Message aligment */
.message-sheet >>> div.your-message:first-of-type {
    margin-top: 25px !important;
}

.message-sheet >>> div.message-item:last-child {
    margin-bottom: 16px !important;
}

.message-sheet >>> .your-message + .your-message {
    margin-top: 8px !important;
}

.message-sheet >>> .my-message + .my-message {
    margin-top: 8px !important;
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
</style>

<template>
    <v-list-item
        :value="conversation"
        class="conversation-item"
        @click="onOpenConv"
        :class="{
            'channel-conversation': conversation.channel == true,
            'has-new-message': hasNewMessage,
            'theme--dark': $vuetify.theme.isDark,
        }"
    >
        <template v-if="!conversation.channel">
            <UserAvatar :user="user" :infinity="hasNewMessage" />

            <v-list-item-content class="py-1 px-2 content__text">
                <v-list-item-title
                    class="subtitle-2 mb-0"
                    v-text="name"
                ></v-list-item-title>
                <v-list-item-subtitle
                    v-if="recentMessage || conversation._isTemp"
                    class="caption"
                    style="line-height: 0.8rem;"
                    :class="{ 'font-weight-bold': hasNewMessage }"
                    v-text=" recentMessage || (conversation._isTemp == true && 'Draft')"
                ></v-list-item-subtitle>
            </v-list-item-content>
        </template>
        <!-- Conversation template -->
        <template v-else>
            <v-list-item-title
                class="subtitle-2 my-0 content__text d-flex"
                :class="{ 'font-weight-bold': hasNewMessage }"
            >
                <v-icon size="15">mdi-pound</v-icon>
                <span class="ml-1" v-text="name"></span>
            </v-list-item-title>
        </template>
    </v-list-item>
</template>

<script>
import UserAvatar from "./avatar/user-avatar.vue";
export default {
    props: ["conversation"],
    components: { UserAvatar },
    data: vm => ({
        recentMessage: "",
        messages: vm.conversation.messages,
        unreadMessages: vm.conversation.meta.unreadMessages,
    }),
    computed: {
        hasNewMessage() {
            return this.unreadMessages.length > 0;
        },
        user() {
            if (!this.conversation.channel && this.conversation.subscribers) {
                const friends = this.conversation.subscribers.filter(
                    user => !user._isMe
                );
                if (friends.length > 0) {
                    return friends[0];
                }
            }
            // Dummy data
            return null;
        },
        name() {
            if (this.user) {
                return this.user.fullName || this.user.firstName + ', ' + this.user.lastName
            }

            return this.conversation.name;
        }
    },
    watch: {
        messages() {
            this.updateRecentMessage();
        },
        hasNewMessage() {
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
                        {
                            let html = recentMsg.body.content;
                            html = html.replace(/<img/g, '<span').replace(/<\/img/g, '</span');
                            const el = document.createElement("div");
                            el.innerHTML = html;
                            this.recentMessage = el.innerText;
                        }
                        break;

                    default:
                        break;
                }
            }
        },
        getRecentMessage() {
            // Show unread message
            if (this.hasNewMessage == true && this.unreadMessages.length > 0) {
                return this.unreadMessages[this.unreadMessages.length - 1];
            }

            if (
                !this.conversation.messages ||
                this.conversation.messages.length <= 0
            ) {
                return null;
            }

            // Show the last message
            return this.conversation.messages[
                this.conversation.messages.length - 1
            ];
        },
        onOpenConv() {
            if (this.conversation.meta.unreadMessages.length > 0) {
                this.$store
                    .dispatch(
                        "conversations/watchAllMessage",
                        this.conversation.id
                    )
                    .catch(console.error);
            }
        },
    },
};
</script>

<style>
.conversation-item {
    display: flex;
    align-items: center;
    -webkit-box-align: center;
    -webkit-box-flex: 1;
    flex: 1 1 100%;
    text-decoration: none;
    outline: none;
}

.conversation-item.v-list-item {
    min-height: 50px;
    color: inherit;
}

.conversation-item.v-list-item.channel-conversation {
    min-height: 36px;
}

.conversation-item.has-new-message {
    position: relative;
}

.conversation-item.has-new-message::after {
    animation: all 0.2s linear;
    animation: conversation-item-opacity 0.2s linear;
    content: "";
    position: absolute;
    background-color: var(--primary-color-2);
    width: 3px;
    left: 0px;
    bottom: -0;
    top: -0;
}

@keyframes conversation-item-opacity {
    0% {
        opacity: 0;
    }
    100% {
        opacity: 1;
    }
}

.conversation-item.has-new-message::after {
    background-color: #1e88e5;
}

.conversation-item .content__text {
    opacity: 0.7;
    max-width: 218px;
}

.conversation-item.has-new-message .content__text {
    animation: all 0.2s linear;
    opacity: 1;
}

.conversation-item.v-list-item.v-item--active .content__text {
    animation: all 0.2s linear;
    opacity: 1;
}

</style>

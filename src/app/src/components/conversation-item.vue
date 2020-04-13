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
            <UserAvatar :user="targetUser" :infinity="hasNewMessage" />

            <v-list-item-content class="py-1 px-2 content__text">
                <v-list-item-title
                    class="subtitle-2 mb-0"
                    v-text="conversation.name"
                ></v-list-item-title>
                <v-list-item-subtitle
                    v-if="recentMessage"
                    class="caption"
                    :class="{ 'font-weight-bold': hasNewMessage }"
                    v-text="recentMessage"
                ></v-list-item-subtitle>
            </v-list-item-content>
        </template>
        <template v-else>
            <v-list-item-title
                class="subtitle-2 my-0 content__text"
                :class="{ 'font-weight-bold': hasNewMessage }"
            >
                <v-icon size="18">mdi-pound</v-icon>
                <span class="ml-1" v-text="conversation.name"></span>
            </v-list-item-title>
        </template>
    </v-list-item>
</template>

<script>
import UserAvatar from "./user-avatar.vue";
export default {
    props: ["conversation"],
    components: { UserAvatar },
    data: vm => ({
        recentMessage: "",
        messages: vm.conversation.messages,
        unreadMessage: vm.conversation.meta.unreadMessage,
    }),
    computed: {
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
        hasNewMessage() {
            return this.unreadMessage.length > 0;
        },
    },
    watch: {
        messages() {
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
                            const html = recentMsg.body.content;
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
        onOpenConv() {
            if (this.conversation.meta.unreadMessage.length > 0) {
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

<style scoped>
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
    min-height: 54px;
    color: inherit;
}

.conversation-item.v-list-item.channel-conversation {
    min-height: 40px;
}

.has-new-message {
    position: relative;
}

.has-new-message::after {
    animation: all 0.2s linear;
    animation: opacity 0.2s linear;
    content: "";
    position: absolute;
    background-color: var(--primary-color-2);
    width: 3px;
    left: 0px;
    bottom: -0;
    top: -0;
}

@keyframes opacity {
    0% {
        opacity: 0;
    }
    100% {
        opacity: 1;
    }
}

.has-new-message::after {
    background-color: var(--primary-color-2);
}

.theme--dark.has-new-message::after {
    background-color: var(--primary-color--text);
}

.content__text {
    opacity: 0.7;
}

div:not(.has-new-message).content__text {
    opacity: 1;
}

.has-new-message >>> .v-icon {
    animation: blink 1s linear infinite;
    color: inherit;
}

@keyframes blink {
    0% {
        opacity: 0.6;
        transform: scale(1);
    }
    50% {
        opacity: 1;
        transform: scale(1.1);
    }
    100% {
        opacity: 0.6;
        transform: scale(1);
    }
}

.content__text {
    max-width: 218px;
}
</style>

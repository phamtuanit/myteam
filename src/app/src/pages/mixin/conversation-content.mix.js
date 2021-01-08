
import { scrollToBottom } from "../../utils/layout.js";
import { mapState } from "vuex";
const MAX_MESSAGES = 30;
export default {
    props: {
        conversation: {
            type: Object,
        },
    },
    data() {
        return {
            loadMore: this.onLoadMore,
            theme: this.$vuetify.theme,
            newMessage: null,
            messages: [],
            hasUnreadMessages: false,
            unreadMessages: this.conversation.meta.unreadMessages,
            parentMessageIds: null, // To keep parent message list when user do quote
        };
    },
    computed: {
        ...mapState({
            activatedConv: state => state.conversations.channel.active,
        })
    },
    created() {
        this.messages = this.conversation.messages;
    },
    mounted() {
        setTimeout(() => {
            this.$nextTick(this.scrollToBottom);
            // Watch scroll
            this.$refs.messageFeed.$el.addEventListener("scroll", this.handleScroll);
        }, 2000);
    },
    destroyed() {
        this.$refs.messageFeed.$el.removeEventListener("scroll", this.handleScroll);
    },
    watch: {
        "unreadMessages"() {
            this.handleScroll();
        },
        newMessage(value) {
            if (!value) {
                // Reset quote status
                this.parentMessageIds = null;
            }
        },
        activatedConv(conv) {
            if (conv && conv.id == this.conversation.id) {
                setTimeout(this.scrollToBottom, 200);
            } else {
                setTimeout(this.trancateMessages, 1000);
            }
        },
    },
    methods: {
        // Message actions
        onDeleteMessage(message) {
            this.$store.dispatch("conversations/deleteMessage", message).catch(console.error);
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
        onQuote(message) {
            this.onRead();
            if (!message || !message.body.content ||
                (message.body.type != null && message.body.type != "html")) {
                return;
            }
            this.newMessage = `<blockquote>${message.body.content}</blockquote><p></p>`;
            const parentMsgIds = (message.body.parent_message_ids && [...message.body.parent_message_ids]) || [];
            parentMsgIds.push(message.id);
            this.parentMessageIds = parentMsgIds;

            const userId = message.from.issuer;
            if (this.$store.state.users.me.id !== userId) {
                this.$store.dispatch("users/resolve", [userId])
                .then(users => {
                    let userName = userId;
                    if (Array.isArray(users) && users.length > 0) {
                        userName = users[0].fullName || userName;
                    }

                    const mention = `<p><span class="mention user-mention" data-mention="@${userName}" data-user-id="${userId}">@${userName} </span> </p>`;
                    this.newMessage = `<blockquote data-author="${userId}" data-author-name="${userName}">${message.body.content}</blockquote>` + mention;
                });
            }
        },
        onCopy(message) {
            this.onRead();
            if (!message || !message.body.content || (message.body.type != null && message.body.type != "html")) {
                return;
            }
            this.newMessage = message.body.content;
        },
        onRead() {
            const conv = this.conversation;
            if (conv && this.unreadMessages.length > 0) {
                this.$store.dispatch("conversations/watchAllMessage", conv.id).catch(console.error);
            }
        },
        loadUnreadMessages() {
            setTimeout(this.scrollToBottom, 0);
            this.onRead();
        },
        scrollToBottom() {
            this.hasUnreadMessages = false;
            const msgSheetEl = this.$refs.messageFeed.$el;
            scrollToBottom(msgSheetEl);
        },
        // Load more message
        onLoadMore() {
            if (this.conversation._isTemp == true) {
                return Promise.resolve([]);
            }

            return this.$store.dispatch("conversations/getConversationContent", {
                convId: this.conversation.id,
            }).catch(console.error);
        },
        handleScroll() {
            const el = this.$refs.messageFeed.$el;
            if (el.scrollTop + el.clientHeight + 100 >= el.scrollHeight) {
                this.hasUnreadMessages = false;
                return;
            }

            this.hasUnreadMessages = true;
        },
        trancateMessages() {
            if (!this.activatedConv || this.activatedConv.id == this.conversation.id) {
                return;
            }

            // Trancate inactive conversation's messages
            if (this.conversation.messages.length >= MAX_MESSAGES) {
                return this.$store.dispatch("conversations/trancateMessages", {
                    convId: this.conversation.id,
                }).catch(console.error);
            }
        }
    }
}

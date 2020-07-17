
import { scrollToBottom } from "../../utils/layout.js";
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
            allowReadMore: false,
            unreadMessages: this.conversation.meta.unreadMessages,
        };
    },
    created() {
        this.messages = this.conversation.messages;
    },
    mounted() {
        // Watch scroll
        this.$refs.messageFeed.$el.addEventListener(
            "scroll",
            this.handleScroll
        );
        setTimeout(this.scrollToBottom, 1000, this);
    },
    destroyed() {
        this.$refs.messageFeed.$el.removeEventListener(
            "scroll",
            this.handleScroll
        );
    },
    watch: {
        "unreadMessages"() {
            this.handleScroll();
        }
    },
    methods: {
        onLoadMore() {
            if (this.conversation._isTemp == true) {
                return Promise.resolve([]);
            }

            return this.$store
                .dispatch("conversations/getConversationContent", {
                    convId: this.conversation.id,
                })
                .catch(console.error);
        },
        onDeleteMessage(message) {
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
        onQuote(message) {
            this.onRead();
            if (
                !message ||
                !message.body.content ||
                (message.body.type != null && message.body.type != "html")
            ) {
                return;
            }

            this.newMessage = `<blockquote>${message.body.content}</blockquote><p></p>`;
        },
        onRead() {
            const conv = this.conversation;
            if (conv && this.unreadMessages.length > 0) {
                this.$store
                    .dispatch("conversations/watchAllMessage", conv.id)
                    .catch(console.error);
            }
        },
        onReadMore() {
            setTimeout(this.scrollToBottom, 0);
            this.onRead();
        },
        handleScroll() {
            const el = this.$refs.messageFeed.$el;
            if (el.scrollTop + el.clientHeight + 100 >= el.scrollHeight) {
                this.allowReadMore = false;
                return;
            }

            this.allowReadMore = true;
        },
        scrollToBottom() {
            this.allowReadMore = false;
            const msgSheetEl = this.$refs.messageFeed.$el;
            scrollToBottom(msgSheetEl);
        },
    }
}

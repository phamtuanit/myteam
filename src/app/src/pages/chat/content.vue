<template>
  <div class="chat-box fill-height">
    <v-sheet
      class="overflow-y-auto message-sheet no-border-radius"
      v-chat-scroll="{ always: false, smooth: true }"
    >
      <v-list-item
        v-for="(msg, index) in messages"
        :key="msg.id"
        class="mt-1 px-2"
      >
        <v-list-item-avatar></v-list-item-avatar>
        <v-spacer></v-spacer>
        <v-card
          flat
          class="mr-1 message--text py-1"
        >
          <v-card-subtitle
            class="py-1"
            v-text="new Date().toLocaleString()"
          >
          </v-card-subtitle>
          <v-card-text
            class="pt-0 pb-1 px-4"
            v-html="msg.body.content"
          >
          </v-card-text>
        </v-card>
        <v-list-item-avatar class="ma-0">
          <v-avatar
            size="30"
            class="mx-auto"
          >
            <v-img :src="`https://randomuser.me/api/portraits/men/${index}.jpg`"></v-img>
          </v-avatar>
        </v-list-item-avatar>
      </v-list-item>
    </v-sheet>

    <!-- Input -->
    <v-list
      height="48"
      class="py-0 no-border-radius"
    >
      <v-divider></v-divider>
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
import { mapState } from "vuex";
export default {
    components: { EmojiButton },
    data() {
        return {
            theme: this.$vuetify.theme,
            newMessage: "",
        };
    },
    computed: {
        ...mapState({
            activatedChat: state => state.chats.active,
        }),
        chatId() {
            return this.activatedChat ? this.activatedChat.id : -1;
        },
        messages() {
            return this.activatedChat.messages || [];
        },
    },
    watch: {
        activatedChat() {
            this.loadChatContent();
        },
    },
    created() {
        this.loadChatContent();
    },
    mounted() {
        fillHeight("message-sheet", 49, this.$el);
    },
    methods: {
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
                        this.newMessage = null;
                    })
                    .catch(console.error);
            }
        },
        onClearMessage() {
            this.newMessage = "";
        },
        onSelectEmoji(emoji) {
            this.newMessage += emoji.native;
        },
        loadChatContent() {},
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

/* .chat-box >>> .v-card__text {
  background-color: #029ce4;
} */
</style>

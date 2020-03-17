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
        <v-card flat dark class="mr-1 message--text">
          <v-card-text class="py-2 px-3" v-html="msg.body.content.html">
          </v-card-text>
        </v-card>
        <v-list-item-avatar class="ma-0">
          <v-avatar size="30" class="mx-auto">
            <v-img
              :src="`https://randomuser.me/api/portraits/men/${index}.jpg`"
            ></v-img>
          </v-avatar>
        </v-list-item-avatar>
      </v-list-item>
    </v-sheet>
    <v-list height="48" class="py-0 no-border-radius">
      <v-divider></v-divider>
      <v-list-item class="px-0 px-2">
        <EmojiButton @select="onSelectEmoji"></EmojiButton>
        <v-text-field
          flat
          class="no-border-radius"
          v-model="message"
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
          :disabled="!message"
          @click="onSendMessage"
        >
          <v-icon>mdi-send</v-icon>
        </v-btn>
      </v-list-item>
    </v-list>
  </div>
</template>

<script>
import { fillHeight } from "../utils/layout.js";
import EmojiButton from "./emoji-button";
import MessageService from "../services/message.service";
import ConversationService from "../services/conversation.service";
export default {
  components: { EmojiButton },
  data() {
    return {
      theme: this.$vuetify.theme,
      conversation: null,
      message: "",
      messages: []
    };
  },
  created() {
    this.msgService = new MessageService();
    this.conversationService = new ConversationService();

    const socket = window.IoC.get("socket");
    socket.on("live", (act, data) => {
      console.info("---- WS-live:", act, data);
    });
    socket.on("message", (act, data) => {
      console.info("---- WS-message:", act, data);
    });
  },
  mounted() {
    fillHeight("message-sheet", 49, this.$el);
  },
  methods: {
    onSendMessage() {
      if (!this.conversation) {
        // Create conversation
        const group = {
          name: "To tuana",
          subscribers: ["tuanp", "tuana"]
        };
        this.conversationService.post(group).then(res => {
          this.conversation = res.data;
        });
      } else {
        // Send message
        this.msgService.post(this.conversation.id, this.message).then(res => {
          this.messages.push(res.data);
          this.message = "";
        });
      }
    },
    onClearMessage() {
      this.message = "";
    },
    onSelectEmoji(emoji) {
      this.message += emoji.native;
    }
  }
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

.chat-box >>> .v-card__text {
  background-color: #029ce4;
}
</style>

<template>
  <div class="chat-box fill-height">
    <v-sheet class="overflow-y-auto message-sheet" v-chat-scroll="{always: false, smooth: true}">
      <v-card dark
        v-for="(msg, index) in messages"
        :key="msg.id"
        color="light-blue darken-1"
        elevation="0"
        class="my-2 mx-2"
      >
        <v-list-item>
          <v-list-item-content class="py-1" v-html="msg.body.content.html">
          </v-list-item-content>
          <v-list-item-avatar>
            <v-avatar size="30">
              <v-img
                :src="`https://randomuser.me/api/portraits/men/${index}.jpg`"
              ></v-img>
            </v-avatar>
          </v-list-item-avatar>
        </v-list-item>
      </v-card>
    </v-sheet>
    <v-list height="48" class="py-0">
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
export default {
  components: { EmojiButton },
  data() {
    return {
      theme: this.$vuetify.theme,
      message: "",
      messages: []
    };
  },
  created() {
    this.msgService = new MessageService();
  },
  mounted() {
    fillHeight("message-sheet", 50, this.$el);

    // // Get a reference to the div you want to auto-scroll.
    // const parentEl = this.$el.querySelector(".message-sheet");
    // const containerEl = this.$el.querySelector(".message-container");
    // // Create an observer and pass it a callback.
    // const observer = new MutationObserver(() => {
    //   parentEl.scrollTop = parentEl.scrollHeight;
    // });
    // // Tell it to look for new children that will change the height.
    // const config = { childList: true };
    // observer.observe(containerEl, config);
  },
  methods: {
    onSendMessage() {
      this.msgService.post(1583816169094, this.message).then(msg => {
        this.message = "";
        this.messages.push(msg.data);
      });
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
.chat-box >>> .theme--light.v-btn.v-btn--icon {
  color: var(--primary-color-2);
}
</style>

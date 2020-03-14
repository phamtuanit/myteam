<template>
  <div class="chat-box fill-height">
    <v-sheet class="overflow-y-auto message-container">
      <v-container style="height: 1500px;" class="pa-0"> </v-container>
    </v-sheet>
    <v-list height="48" class="py-0">
      <v-divider></v-divider>
      <v-list-item class="px-0 pr-2">
        <v-text-field
          flat
          class="no-border-radius"
          v-model="message"
          hide-details
          solo
          clearable
          @keyup.esc="clearMessage"
          @keyup.enter="sendMessage"
          clear-icon="mdi-close"
        ></v-text-field>
        <v-btn icon class="send-btn">
          <v-icon>mdi-send</v-icon>
        </v-btn>
        <EmojiButton></EmojiButton>
      </v-list-item>
    </v-list>
  </div>
</template>

<script>
import { fillHeight } from "../utils/layout.js";
import EmojiButton from "./emoji-button";
export default {
  components: { EmojiButton },
  data() {
    return {
      theme: this.$vuetify.theme,
      message: ""
    };
  },
  mounted() {
    fillHeight("message-container", 50, this.$el);
  },
  methods: {
    sendMessage() {
      this.message = "";
    },
    clearMessage() {
      this.message = "";
    },
    onSelectEmoji(emoji) {
      this.$emit("select", emoji);
    }
  }
};
</script>

<style lang="css" scoped>
.chat-box >>> .theme--light.v-btn.v-btn--icon {
  color: var(--primary-color-2);
}
</style>

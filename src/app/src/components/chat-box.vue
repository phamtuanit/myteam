<template>
  <div class="fill-height">
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
        <v-btn icon>
          <v-icon>mdi-send</v-icon>
        </v-btn>
        <v-menu
          top
          offset-y
          v-model="showEmojiPicker"
          :eager="true"
          internal-activator
          transition="scroll-y-transition"
          :close-on-content-click="false"
          @keyup.enter="showEmojiPicker = false"
        >
          <template v-slot:activator="{ on }">
            <v-btn icon v-on="on">
              <v-icon>mdi-emoticon-happy-outline</v-icon>
            </v-btn>
          </template>

          <picker
            :data="emojiData"
            :exclude="['flags', 'symbols']"
            :color="theme.dark ? '#1E1E1E' : '#ae65c5'"
            :showPreview="false"
            set="twitter"
            :infiniteScroll="true"
            @select="onSelectEmoji"
          ></picker>
        </v-menu>
      </v-list-item>
    </v-list>
  </div>
</template>

<script>
import { fillHeight } from "../utils/layout.js";
import { Picker, EmojiIndex } from "emoji-mart-vue-fast";
import emojiData from "emoji-mart-vue-fast/data/twitter.json";
const emojiIndex = new EmojiIndex(emojiData);
export default {
  components: { Picker },
  data() {
    return {
      emojiData: emojiIndex,
      theme: this.$vuetify.theme,
      showEmojiPicker: false,
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
      this.message += emoji.native;
    }
  }
};
</script>

<style lang="css">
.emoji-type-image.emoji-set-twitter {
  background-image: url("../assets/emoji/twitter-emoji-32.png");
}
</style>

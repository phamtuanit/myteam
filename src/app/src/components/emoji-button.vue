<template>
  <v-menu
    :left="true"
    offset-y
    v-model="showEmojiPicker"
    :eager="true"
    internal-activator
    transition="scroll-y-transition"
    :close-on-content-click="false"
  >
    <template v-slot:activator="{ on }">
      <v-btn
        icon
        :small="small"
        v-on="on"
      >
        <v-icon :small="small">mdi-emoticon-happy-outline</v-icon>
      </v-btn>
    </template>

    <picker
      :data="emojiData"
      color="#043752"
      :showPreview="false"
      set="twitter"
      :infiniteScroll="true"
      @select="onSelectEmoji"
      @keyup.esc="showEmojiPicker = false"
    ></picker>
  </v-menu>
</template>

<script>
import { Picker, EmojiIndex } from "emoji-mart-vue-fast";
import emojiData from "emoji-mart-vue-fast/data/twitter.json";
import "emoji-mart-vue-fast/css/emoji-mart.css";
const emojiIndex = new EmojiIndex(emojiData, {
    exclude: ["flags", "symbols"],
});
export default {
    props: {
        small: {
            type: Boolean,
            default: false,
        },
    },
    components: { Picker },
    data() {
        return {
            emojiData: emojiIndex,
            showEmojiPicker: false,
        };
    },
    methods: {
        onSelectEmoji(emoji) {
            this.$emit("select", emoji);
        },
    },
};
</script>


<style lang="css">
.emoji-type-image.emoji-set-twitter {
    background-image: url("../assets/emoji/twitter-emoji-32.png");
}
</style>

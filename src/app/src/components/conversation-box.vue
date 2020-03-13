<template>
  <div>
    <v-sheet class="overflow-y-auto message-container">
      <v-container
        style="height: 1500px;"
        class="pa-0"
      >

      </v-container>
    </v-sheet>
    <v-list height="58">
      <v-divider></v-divider>
      <v-list-item class="px-0 pr-2">
        <v-text-field
          flat
          class="no-radius"
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
          v-model="showEmojiPicker"
          :eager="true"
          internal-activator
          :close-on-content-click="false"
          @keyup.enter="showEmojiPicker = false"
        >
          <template v-slot:activator="{ on }">
            <v-btn
              icon
              v-on="on"
            >
              <v-icon>mdi-emoticon-happy-outline</v-icon>
            </v-btn>
          </template>

          <picker
            title=""
            :color="theme.dark ? '#1E1E1E' : '#ae65c5'"
            :showPreview="false"
            :infiniteScroll="true"
            :backgroundImageFn="getEmojiSheet"
            @select="addEmoji"
          ></picker>
        </v-menu>

      </v-list-item>
    </v-list>
  </div>
</template>

<script>
import { fillHeight } from "../utils/layout.js";
import { Picker } from "emoji-mart-vue";
export default {
  components: { Picker },
  data() {
    return {
      theme: this.$vuetify.theme,
      showEmojiPicker: false,
      message: ""
    };
  },
  mounted() {
    fillHeight(this.$el, 0);
    fillHeight("message-container", 58, this.$el);
  },
  methods: {
    sendMessage() {
      this.message = "";
    },
    clearMessage() {
      this.message = "";
    },
    addEmoji(emoji) {
      console.log(emoji);
      this.message += emoji.native;
    },
    getEmojiSheet() {
      return require("../assets/emoji/facebook-emoji-20.png");
    }
  }
};
</script>

<style>
</style>
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
          hide-details
          solo
          clearable
          clear-icon="mdi-close"
        ></v-text-field>
        <v-btn icon>
          <v-icon>mdi-send</v-icon>
        </v-btn>
        <v-btn icon>
          <v-icon>mdi-emoticon-happy-outline</v-icon>
        </v-btn>
      </v-list-item>
    </v-list>
  </div>
</template>

<script>
import { fillHeight } from "../utils/layout.js";
export default {
  data() {
    return {};
  },
  mounted() {
    fillHeight(this.$el, 0);
    fillHeight("message-container", 58, this.$el);
  }
};
</script>

<style>
</style>
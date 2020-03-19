<template>
  <v-sheet
    width="220px"
    class="pa-0 fill-height no-border-radius border-y border-y-l"
  >
    <v-list class="px-0">
      <v-subheader class="px-3">Friends</v-subheader>

      <!-- 1 -->
      <v-list-item @click="openChat()">
        <v-avatar
          size="30"
          class="ml-1"
        >
          <v-img src="https://randomuser.me/api/portraits/men/81.jpg"></v-img>
        </v-avatar>

        <v-list-item-content class="py-2 px-2">
          <v-list-item-title class="body-2">Jon Son</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <!-- 2 -->
      <v-list-item @click="openChat()">
        <v-avatar
          size="30"
          class="ml-1"
        >
          <v-img src="https://randomuser.me/api/portraits/men/41.jpg"></v-img>
        </v-avatar>

        <v-list-item-content class="py-2 px-2">
          <v-list-item-title class="body-2">Wilance Joy</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-sheet>
</template>

<script>
// import { fillHeight } from "../utils/layout.js";
export default {
  data() {
    return {};
  },
  mounted() {
    // fillHeight(this.$el, 0);
  },
  methods: {
    openChat() {}
  }
};
</script>

<style>
.secondary-bg .v-list {
  background-color: transparent;
}
</style>
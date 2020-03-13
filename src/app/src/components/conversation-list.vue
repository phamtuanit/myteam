<template>
  <v-sheet
    width="280px"
    class="pa-0 fill-height no-radius"
    dark
    id="conversation-list"
    color="secondary-bg"
  >
    <!-- Search -->
    <v-list
      dense
      dark
      color="secondary-bg"
      class="pb-0"
    >
      <v-list-item class="px-3 mt-1">
        <v-text-field
          prepend-inner-icon="mdi-magnify"
          label="Search"
          flat
          solo-inverted
          rounded
          hide-details
          clearable
          clear-icon="mdi-close"
        ></v-text-field>
        <v-btn
          icon
          size="40"
          outlined
          class="ml-2"
        >
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </v-list-item>
      <!-- <v-divider></v-divider> -->
    </v-list>
    <!-- Dynamic data -->
    <v-list
      two-line
      dark
      color="secondary-bg"
      class="py-0 px-0"
    >
      <v-subheader class="pl-3 pr-2">Recent chat</v-subheader>
      <v-list-item-group v-model="selectedConv">

        <!-- 1 -->
        <v-list-item @click="openChat()">
          <v-avatar size="30">
            <v-img src="https://randomuser.me/api/portraits/men/81.jpg"></v-img>
          </v-avatar>

          <v-list-item-content class="py-2 px-2">
            <v-list-item-title class="body-2">Jon Son</v-list-item-title>
            <v-list-item-subtitle class="caption">Can I help you? It seems that you facce a big problem.</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <!-- 2 -->
        <v-list-item @click="openChat()">
          <v-avatar size="30">
            <v-img src="https://randomuser.me/api/portraits/men/41.jpg"></v-img>
          </v-avatar>

          <v-list-item-content class="py-2 px-2">
            <v-list-item-title class="body-2">Wilance Joy</v-list-item-title>
            <v-list-item-subtitle class="caption">Can I help you? It seems that you facce a big problem.</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list-item-group>
    </v-list>
  </v-sheet>
</template>

<script>
// import { fillHeight } from "../utils/layout.js";
export default {
  data() {
    return {
      selectedConv: null
    };
  },
  mounted() {
    // fillHeight(this.$el, 0);
  },
  methods: {
    openChat() {}
  }
};
</script>

<style scoped>
#conversation-list >>> .v-text-field.v-text-field--solo .v-input__control {
  min-height: 40px !important;
}

#conversation-list
  >>> .v-text-field--rounded
  > .v-input__control
  > .v-input__slot {
  padding: 0 16px;
}

#conversation-list >>> .v-text-field--rounded {
  border-radius: 20px;
}

#conversation-list >>> .v-btn {
  border-color: rgba(255, 255, 255, 0.16);
}
</style>
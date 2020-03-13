<template>
  <v-app id="app">
    <v-navigation-drawer
      permanent
      mini-variant
      dark
      app
      mini-variant-width="66"
      color="primary-bg"
    >
      <v-list-item class="px-0 mt-2 mb-1">
        <v-avatar
          size="40"
          class="mx-auto"
        >
          <v-img src="https://randomuser.me/api/portraits/men/85.jpg"></v-img>
        </v-avatar>
      </v-list-item>
      <!-- Chat -->
      <v-list-item class="px-0 mt-3">
        <v-badge
          overlap
          color="red darken-3"
          light
          content="8"
        >
          <v-tooltip right>
            <template v-slot:activator="{ on }">
              <v-btn
                icon
                v-on="on"
              >
                <v-icon color="white">mdi-forum-outline</v-icon>
              </v-btn>
            </template>
            <span>Chat</span>
          </v-tooltip>
        </v-badge>
      </v-list-item>
      <!-- Group -->
      <v-list-item class="px-0 mt-2">
        <v-badge
          overlap
          color="red darken-3"
          light
          content="1"
        >
          <v-tooltip right>
            <template v-slot:activator="{ on }">
              <v-btn
                icon
                v-on="on"
              >
                <v-icon color="white">mdi-account-group</v-icon>
              </v-btn>
            </template>
            <span>Group</span>
          </v-tooltip>
        </v-badge>
      </v-list-item>
      <template v-slot:append>
        <div class="pa-2 text-center">
          <v-btn
            icon
            @click="enableDarkMode"
            title="Dark / Light"
          >
            <v-icon>mdi-theme-light-dark</v-icon>
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <v-content>
      <v-container
        class="pa-0 fill-height"
        fluid
      >
        <v-row
          class="fill-height"
          no-gutters
        >
          <v-col cols="auto">
            <ConversationList></ConversationList>
          </v-col>
          <v-col>
            <Conversation></Conversation>
          </v-col>
          <v-col cols="auto">
            <Friend></Friend>
          </v-col>
        </v-row>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
import ConversationList from "./components/conversation-list";
import Conversation from "./components/conversation-box.vue";
import Friend from "./components/friend-zone";
export default {
  components: { ConversationList, Conversation, Friend },
  provide() {
    return { theme: this.theme };
  },
  data(vm) {
    return {
      theme: vm.$vuetify.theme
    };
  },
  created() {
    window.IoC.register("app", this);
  },
  methods: {
    enableDarkMode() {
      this.theme.dark = !this.theme.dark;
    }
  }
};
</script>
<style lang="css">
@import "./assets/common.css";
@import "./assets/color.css";

#app {
  height: 100%;
}
</style>

<style scoped>
#app >>> .v-navigation-drawer .v-navigation-drawer__border {
  background-color: transparent !important;
  width: 0px;
}
</style>
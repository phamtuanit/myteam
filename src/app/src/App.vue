<template>
  <v-app id="app">
    <LeftDrawer></LeftDrawer>

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
            <ChatBox></ChatBox>
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
import ChatBox from "./components/chat-box.vue";
import Friend from "./components/friend-zone";
import LeftDrawer from "./components/left-drawer";
export default {
  name: "App",
  components: { ConversationList, ChatBox, Friend, LeftDrawer },
  provide() {
    return { theme: this.theme };
  },
  data() {
    return {};
  },
  created() {
    window.IoC.register("app", this);
  },
  methods: {}
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

<template>
  <v-content id="main-layout">
    <LeftDrawer></LeftDrawer>
    <v-container class="pa-0 fill-height" fluid>
      <v-row class="fill-height" no-gutters>
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
</template>

<script>
import ConversationList from "../components/conversation-list";
import ChatBox from "../components/chat-box.vue";
import Friend from "../components/friend-zone";
import LeftDrawer from "../components/left-drawer";
export default {
  components: { ConversationList, ChatBox, Friend, LeftDrawer },
  created() {
    
  }
};
</script>


<style scoped>
#main-layout >>> .v-navigation-drawer .v-navigation-drawer__border {
  background-color: transparent !important;
  width: 0px;
}
</style>

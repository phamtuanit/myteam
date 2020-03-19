<template>
  <v-row class="fill-height" no-gutters>
    <v-col cols="auto">
      <ChatList></ChatList>
    </v-col>
    <v-col>
      <ChatContent></ChatContent>
    </v-col>
    <v-col cols="auto">
      <FriendList></FriendList>
    </v-col>
  </v-row>
</template>

<script>
import ChatList from "./chat-list";
import ChatContent from "./content.vue";
import FriendList from "./friend-list";
export default {
  components: { ChatList, ChatContent, FriendList }
};
</script>

<style>
</style>

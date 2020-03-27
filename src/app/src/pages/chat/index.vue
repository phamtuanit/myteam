<template>
    <v-row class="fill-height" no-gutters>
        <v-col cols="auto">
            <ChatList></ChatList>
        </v-col>
        <v-col>
            <ChatContent v-if="activatedChat"></ChatContent>
        </v-col>
    </v-row>
</template>

<script>
import ChatList from "./chat-list";
import ChatContent from "./content.vue";

import { mapState } from "vuex";
export default {
    components: { ChatList, ChatContent },
    computed: {
        ...mapState({
            activatedChat: state => state.chats.active,
        }),
    },
    created() {
        // if (this.$route.query._status == "temp") {
        //     this.$nextTick(() => {
        //         this.$router.updateQuery({});
        //     });
        // }
    },
};
</script>

<style>
</style>

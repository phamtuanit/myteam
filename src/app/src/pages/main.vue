<template>
    <v-content id="main-layout" class="main-view">
        <LeftDrawer></LeftDrawer>
        <RouterView :key="$route.name" />
    </v-content>
</template>

<script>
import LeftDrawer from "../components/drawer/left-drawer";
import RouterView from "../components/router-view/keep-alive-view.vue";

import { mapState } from "vuex";

const BASE_WEB_TITLE = "My Team";
export default {
    components: { LeftDrawer, RouterView },
    computed: {
        ...mapState({
            chatUnread: state => state.conversations.chat.unread,
            channelUread: state => state.conversations.channel.unread,
        }),
    },
    watch: {
        chatUnread() {
            this.updateTitle();
        },
        channelUread() {
            this.updateTitle();
        },
    },
    methods: {
        updateTitle() {
            if (this.chatUnread.length > 0 || this.chatUnread.length > 0) {
                // Update website title
                document.title = `${BASE_WEB_TITLE} \ud83d\udc8c You have new message`;
            } else {
                document.title = BASE_WEB_TITLE;
            }
        },
    },
};
</script>

<style lang="css">
@import "../assets/hightlight.css";
</style>

<style scoped>
#main-layout >>> .v-navigation-drawer .v-navigation-drawer__border {
    background-color: transparent !important;
    width: 0px;
}
</style>

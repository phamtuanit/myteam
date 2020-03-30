<template>
    <v-row class="fill-height" no-gutters>
        <v-col cols="auto">
            <ChatList></ChatList>
        </v-col>
        <v-col>
            <v-tabs-items v-model="activatedConv" class="conversation-group">
                <v-tab-item
                    v-for="conv in conversations"
                    :key="conv.id || conv._id"
                    :value="conv.id || conv._id"
                    :transition="false"
                    :reverse-transition="false"
                >
                    <ChatContent :conversation="conv"></ChatContent>
                </v-tab-item>
            </v-tabs-items>
        </v-col>
    </v-row>
</template>

<script>
import ChatList from "./chat-list";
import ChatContent from "./content.vue";

import { fillHeight } from "../../utils/layout.js";
import { mapState } from "vuex";
export default {
    components: { ChatList, ChatContent },
    data() {
        return {
            activatedConv: null,
            conversations: [],
        };
    },
    computed: {
        ...mapState({
            activatedChat: state => state.chats.active,
        }),
    },
    watch: {
        activatedChat() {
            if (this.activatedChat) {
                const activatedConvId =
                    this.activatedChat.id || this.activatedChat._id;
                const existingConv = this.conversations.find(
                    con => (con.id || con._id) == activatedConvId
                );
                if (existingConv) {
                    this.activatedConv = existingConv.id || existingConv._id;
                } else {
                    this.conversations.push(this.activatedChat);
                    this.activatedConv = activatedConvId;
                }
            } else {
                this.activatedConv = null;
            }
        },
    },
    created() {},
    mounted() {
        fillHeight("conversation-group", 0, this.$el);
    },
};
</script>

<style>
</style>

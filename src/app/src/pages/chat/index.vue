<template>
    <v-row class="fill-height couple-conversation" no-gutters>
        <!-- Conversation list -->
        <v-col cols="auto">
            <ChatList></ChatList>
        </v-col>
        <v-col class="d-flex flex-column">
            <!-- Fake header -->
            <div v-if="!currentConvId">
                <v-sheet height="57" class="pa-0 no-border-radius"></v-sheet>
                <v-divider></v-divider>
            </div>

            <!-- Conversation content -->
            <v-tabs-items v-model="currentConvId" class="conversation-group flex-grow-1">
                <v-tab-item
                    v-for="conv in conversations"
                    :key="conv.id"
                    :value="conv.id"
                    :transition="false"
                    :reverse-transition="false"
                >
                    <ChatContent
                        :conversation="conv.value"
                        @show-friend-list="
                            displayFriendList = !displayFriendList
                        "
                    ></ChatContent>
                </v-tab-item>
            </v-tabs-items>
        </v-col>

        <!-- Friend list -->
        <v-expand-x-transition>
            <v-col cols="auto" v-if="displayFriendList">
                <FriendList></FriendList>
            </v-col>
        </v-expand-x-transition>
    </v-row>
</template>

<script>
import ChatList from "./chat-list";
import ChatContent from "./content.vue";
import FriendList from "./friend-list";

import { fillHeight } from "../../utils/layout.js";
import { mapState } from "vuex";
export default {
    components: { ChatList, ChatContent, FriendList },
    data() {
        return {
            displayFriendList: true,
            currentConvId: null,
            conversations: [],
        };
    },
    computed: {
        ...mapState({
            activatedConv: state => state.chats.active,
        }),
    },
    watch: {
        activatedConv() {
            this.updateData();
        },
    },
    created() {
        this.updateData();
    },
    methods: {
        updateData() {
            if (this.activatedConv) {
                const convId = this.activatedConv.id || this.activatedConv._id;
                let existingConv = this.conversations.find(
                    con => (con.value.id || con.value._id) == convId
                );

                if (!existingConv) {
                    existingConv = {
                        id: new Date().getTime(),
                        value: this.activatedConv,
                    };
                    this.conversations.push(existingConv);
                }

                this.currentConvId = existingConv.id;
            }
        },
    },
};
</script>

<style scoped>
.couple-conversation >>> .conversation-group {
    background: rgb(243, 242, 241);
}

.couple-conversation >>> .conversation-group.theme--dark {
    background: #121212;
}
</style>

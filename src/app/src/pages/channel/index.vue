<template>
    <div
        class="fill-width fill-height d-flex channel-conversation"
        :class="{ 'theme--dark': $vuetify.theme.isDark }"
        no-gutters
    >
        <!-- Conversation list -->
        <ChatList
            :list="allConv"
            :activated-item="activatedConv"
            :allow-add="true"
            @add="onCreateConv"
        ></ChatList>

        <!-- Conversation content container -->
        <div class="flex-grow-1 d-flex flex-column">
            <!-- Header -->
            <Header :conversation="activatedConv"></Header>
            <v-divider></v-divider>

            <!-- Conversation content -->
            <v-tabs-items
                v-model="currentConvId"
                class="conversation-group flex-grow-1 transparent"
            >
                <v-tab-item
                    v-for="conv in conversations"
                    :key="conv.id"
                    :value="conv.id"
                    :transition="false"
                    :reverse-transition="false"
                >
                    <ChatContent :conversation="conv.value"></ChatContent>
                </v-tab-item>
            </v-tabs-items>
        </div>

        <ChannelSetting
            :display="isAdding"
            @close="isAdding = false"
            @submit="onAddConv"
        ></ChannelSetting>
    </div>
</template>

<script>
import ChatList from "../shared/chat-list";
import ChatContent from "./content.vue";
import ChannelSetting from "./channel-setting.vue";
import Header from "./header.vue";

import { mapState } from "vuex";
export default {
    name: "channel-main",
    components: { ChatList, ChatContent, ChannelSetting, Header },
    data() {
        return {
            isAdding: false,
            displayFriendList: true,
            currentConvId: null,
            conversations: [],
        };
    },
    computed: {
        ...mapState({
            allConv: state => state.conversations.channel.all,
            activatedConv: state => state.conversations.channel.active,
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
        onCreateConv() {
            this.isAdding = true;
        },
        onAddConv(convInfo) {
            return this.$store
                .dispatch("conversations/createConversation", convInfo)
                .then(conv => {
                    this.isAdding = false;
                })
                .catch(console.error);
        },
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
.channel-conversation {
    background: rgb(243, 242, 241);
}

.channel-conversation.theme--dark {
    background: #121212;
}
</style>

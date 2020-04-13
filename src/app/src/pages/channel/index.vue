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
            @add="onAddConv"
        ></ChatList>

        <!-- Conversation content container -->
        <div class="flex-grow-1 d-flex flex-column">
            <!-- Fake header -->
            <div v-if="!currentConvId">
                <v-sheet
                    height="57"
                    min-height="57"
                    class="pa-0 no-border-radius"
                ></v-sheet>
                <v-divider></v-divider>
            </div>

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
    </div>
</template>

<script>
import ChatList from "../shared/chat-list";
import ChatContent from "./content.vue";

import { mapState } from "vuex";
export default {
    name: "channel-main",
    components: { ChatList, ChatContent },
    data() {
        return {
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
    activated() {
        console.log("---> activated", this.$options.name);
        this.$children.forEach(ch => {
            if (typeof ch.activate === "function") {
                ch.activate();
            }
        });
    },
    deactivated() {
        console.log("<--- deactivated", this.$options.name);
    },
    methods: {
        onAddConv() {},
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

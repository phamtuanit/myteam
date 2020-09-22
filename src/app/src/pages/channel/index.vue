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
            :channel="true"
            @add="onCreateConv"
        ></ChatList>

        <!-- Conversation content container -->
        <div class="flex-grow-1 d-flex flex-column">
            <!-- Header -->
            <Header :conversation="activeConvItem.value || {}">
                <template slot="commands-before">
                    <!-- Pinned message -->
                    <v-btn icon small class="mr-2 btn-pin" title="Pin messages"
                        :class="currentConvState.activePinnedMessages == true ? 'pin-activated' : ''" @click="onPin">
                        <v-icon small v-text="currentConvState.activePinnedMessages == true ? 'mdi-pin' : 'mdi-pin-off-outline'"></v-icon>
                    </v-btn>
                    <!-- Search -->
                    <v-btn icon small class="mr-2"
                            v-show="!activeSearch"
                            title="Search"
                            @click="onSearch" >
                        <v-icon size="21">mdi-magnify</v-icon>
                    </v-btn>
                </template>
            </Header>
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
                    <div class="conversation-context-container d-flex flex-grow">
                        <!-- Message content and input -->
                        <ChatContent :conversation="conv.value" class="flex-grow-1" ref="conversationcontent"></ChatContent>
                        <!-- Pinned messages -->
                        <v-expand-x-transition v-if="conv.state.activePinnedMessages == true">
                            <PinnedMessages :conversation="conv.value" @quote="onQuote" @copy="onCopy"></PinnedMessages>
                        </v-expand-x-transition>
                    </div>
                </v-tab-item>
            </v-tabs-items>
        </div>
        <v-expand-x-transition v-if="activeSearch">
            <SearchContext @close="activeSearch = false"></SearchContext>
        </v-expand-x-transition>

        <ChannelSetting
            :display="isAdding"
            @close="isAdding = false"
            @submit="onAddConv"
        ></ChannelSetting>
    </div>
</template>

<script>
import ChatList from "../shared/chat-list";
import SearchContext from "../shared/search";
import ChatContent from "./content.vue";
import ChannelSetting from "./channel-setting.vue";
import Header from "./header.vue";
import PinnedMessages from "./pinned-messages";

import { mapState } from "vuex";
export default {
    name: "channel-main",
    components: {
        ChatList,
        SearchContext,
        ChatContent,
        ChannelSetting,
        Header,
        PinnedMessages,
    },
    data() {
        return {
            isAdding: false,
            displayFriendList: true,
            currentConvId: null,
            conversations: [],
            activeConvItem: {
                value: null,
                state: {}
            },
            activeSearch: false,
        };
    },
    computed: {
        ...mapState({
            allConv: state => state.conversations.channel.all,
            activatedConv: state => state.conversations.channel.active,
        }),
        currentConvState() {
            if (this.activeConvItem && this.activeConvItem.state) {
                return this.activeConvItem.state;
            }
            return {};
        }
    },
    watch: {
        activatedConv() {
            this.updateData();
        },
        currentConvId() {
            this.activeConvItem = this.getActiveConv();
        }
    },
    created() {
        this.updateData();
        this.registerEvents();
    },
    methods: {
        onCreateConv() {
            this.isAdding = true;
        },
        onAddConv(convInfo) {
            return this.$store
                .dispatch("conversations/createConversation", convInfo)
                .then(() => {
                    this.isAdding = false;
                })
                .catch(console.error);
        },
        onPin() {
            if (this.currentConvState) {
                this.currentConvState.activePinnedMessages = !this.currentConvState.activePinnedMessages;
            }
        },
        onQuote(message) {
            if (this.$refs.conversationcontent && this.$refs.conversationcontent[0]) {
                this.$refs.conversationcontent[0].$emit("quote", message);
            }
        },
        onCopy(message) {
            if (this.$refs.conversationcontent && this.$refs.conversationcontent[0]) {
                this.$refs.conversationcontent[0].$emit("copy", message);
            }
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
                        state: {
                            activePinnedMessages: false
                        }
                    };
                    this.conversations.push(existingConv);
                }

                this.currentConvId = existingConv.id;
            }
        },
        registerEvents() {
            const bus = window.IoC.get("bus");
            bus.on("conversation", this.handleConvEvent);
        },
        handleConvEvent(act, conv) {
            switch (act) {
                case "removed":
                    console.info(
                        "A conversation has been deleted.",
                        conv.name,
                        conv.id
                    );
                    {
                        const index = this.conversations.findIndex(
                            c => c.value.id == conv.id
                        );
                        if (index >= 0) {
                            this.conversations.splice(index, 1);
                        }
                    }
                    break;
                default:
                    break;
            }
        },
        getActiveConv() {
            return this.conversations.find(cn => cn.id === this.currentConvId);
        },
        onSearch() {
            this.activeSearch = !this.activeSearch;
        }
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

.conversation-context-container {
    height: calc(100vh - 58px);
}
</style>

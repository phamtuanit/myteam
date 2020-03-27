<template>
    <v-sheet
        width="300px"
        class="pa-0 fill-height no-border-radius"
        dark
        id="chat-list"
    >
        <!-- Search -->
        <v-list dense dark class="pb-0">
            <v-list-item class="px-3 mt-1">
                <v-text-field
                    v-model="searchText"
                    prepend-inner-icon="mdi-magnify"
                    label="Search"
                    flat
                    solo-inverted
                    rounded
                    hide-details
                    clearable
                    clear-icon="mdi-close"
                ></v-text-field>
            </v-list-item>
        </v-list>

        <!-- List -->
        <v-list two-line dark class="py-0 px-0">
            <v-subheader class="pl-3 pr-2">Conversations</v-subheader>

            <!-- Chat list -->
            <v-list-item-group v-model="activatedChat" mandatory>
                <!-- <v-slide-y-transition group> -->
                    <v-list-item
                        v-for="chat in chatList"
                        :key="chat.id || chat._id"
                        :value="chat"
                        @click="onSelect"
                    >
                        <Conversation :conversation="chat" />
                    </v-list-item>
                <!-- </v-slide-y-transition> -->
            </v-list-item-group>
        </v-list>
    </v-sheet>
</template>

<script>
import { mapState } from "vuex";
import UserAvatar from "../../components/user-avatar.vue";
import Conversation from "../../components/conversation-item.vue";
export default {
    components: { UserAvatar, Conversation },
    data() {
        return {
            searchText: null,
        };
    },
    computed: {
        ...mapState({
            chatList: state => state.chats.all,
        }),
        activatedChat: {
            get() {
                return this.$store.state.chats.active;
            },
            set(val) {
                if (val) {
                    return this.$store.dispatch("chats/activeChat", val.id);
                }
            },
        },
    },
    watch: {
        searchText() {
            if (this.displayMode == "friend") {
                this.searchLocker.then(this.searchFriend);
            }
        },
        activatedChat(val) {
            if (val && val.id != this.$route.query._id) {
                const newQuery = { ...this.$route.query };
                delete newQuery._status;
                newQuery._id = val.id;
                this.$router.updateQuery(newQuery);
            }
        },
    },
    created() {
        if (this.$route.query.status == "tmp") {
            this.$router.updateQuery({});
        } else if (this.$route.query._id) {
            return this.$store
                .dispatch("chats/activeChat", this.$route.query._id)
                .then(chat => {
                    if (!chat) {
                        const newQuery = { ...this.$route.query };
                        delete newQuery._status;
                        delete newQuery._id;
                        this.$router.updateQuery(newQuery);
                    }
                })
                .catch(err => {
                    console.error(err);
                    const newQuery = { ...this.$route.query };
                    delete newQuery._id;
                    this.$router.updateQuery(newQuery);
                });
        }
    },
    mounted() {
        this.searchLocker = Promise.resolve();

        // Update url query
        if (!this.$route.query._id && this.activatedChat) {
            const newQuery = { ...this.$route.query };
            newQuery._id = this.activatedChat.id;
            this.$router.updateQuery(newQuery);
        }
    },
    methods: {
        onSelect(chat) {
            if (this.activatedChat.id == chat.id) {
                return;
            }

            // Incase user re-open existing chat
            this.$store.dispatch("chats/activeChat", chat.id);
        },
    },
};
</script>

<style scoped>
#chat-list,
.v-list {
    background-color: var(--primary-color-2) !important;
}

#chat-list >>> .v-text-field.v-text-field--solo .v-input__control {
    min-height: 40px !important;
}

#chat-list >>> .v-text-field--rounded > .v-input__control > .v-input__slot {
    padding: 0 16px;
}

#chat-list >>> .v-text-field--rounded {
    border-radius: 20px;
}

#chat-list >>> .v-btn {
    border-color: rgba(255, 255, 255, 0.16);
}
</style>

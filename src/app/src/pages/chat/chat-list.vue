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
                <v-list-item
                    v-for="chat in chatList"
                    :key="chat.id"
                    :value="chat"
                    @click="openChat(chat)"
                >
                    <UserAvatar :user="getTargetUser(chat)" :animation="activatedChat && activatedChat.id == chat.id && getTargetUser(chat).status == 'on'"/>

                    <v-list-item-content class="py-2 px-2">
                        <v-list-item-title
                            class="body-2"
                            v-text="getChatName(chat)"
                        ></v-list-item-title>
                        <v-list-item-subtitle
                            class="caption"
                            v-text="getRecentMessage(chat)"
                        ></v-list-item-subtitle>
                    </v-list-item-content>
                </v-list-item>
            </v-list-item-group>
        </v-list>
    </v-sheet>
</template>

<script>
import { mapState } from "vuex";
import UserAvatar from "../../components/user-avatar.vue";
export default {
    components: { UserAvatar },
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
        openChat(chat) {
            if (this.activatedChat.id == chat.id) {
                return;
            }

            // Incase user re-open existing chat
            this.$store.dispatch("chats/activeChat", chat.id);
        },
        getChatName(chat) {
            if (chat.name) {
                return chat.name;
            }

            const friends = chat.subscribers
                .filter(user => !user._isMe)
                .map(user => {
                    return (
                        user.fullName || user.firstName + ", " + user.lastName
                    );
                });
            return friends.join(", ");
        },
        getRecentMessage(chat) {
            if (!chat || !chat.recent || !chat.recent.body) {
                return "...";
            }

            const msgType = chat.recent.body.type || "html";
            switch (msgType) {
                case "html":
                    return chat.recent.body.content;

                default:
                    break;
            }
        },
        getTargetUser(chat) {
            if (chat) {
                const friends = chat.subscribers.filter(user => !user._isMe);
                if (friends.length > 0) {
                    return friends[0];
                }
            }
            // Dummy data
            return {};
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

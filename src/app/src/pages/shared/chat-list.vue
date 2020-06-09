<template>
    <v-sheet
        width="280px"
        min-width="280px"
        class="pa-0 fill-height no-border-radius d-flex flex-column"
        id="chat-list"
    >
        <v-sheet
            height="57"
            class="pa-0 center-y no-border-radius px-3"
        >
            <!-- Search -->
            <v-text-field
                v-model="searchText"
                prepend-inner-icon="mdi-magnify"
                label="Search"
                name="search-conversation"
                flat
                solo
                hide-details
                clearable
                clear-icon="mdi-close"
                color="color-2"
                @keyup.esc="searchText = ''"
            ></v-text-field>
        </v-sheet>
        <v-divider></v-divider>

        <div class="pa-0 ma-0 center-y justify-sm-space-between">
            <v-subheader class="pl-3 pr-2 selection-disabled" v-text="channel ? 'Channels' : 'Conversations'"></v-subheader>

            <!-- Add btn -->
            <v-btn
                v-show="channel && allowAddChannel"
                icon
                fab
                class="ml-1 mr-3"
                rounded
                height="26"
                width="26"
                title="Add channel"
                @click="onAddConv"
            >
                <v-icon :size="20">mdi-plus</v-icon>
            </v-btn>
        </div>

        <!-- List -->
        <v-list
            two-line
            class="py-0 px-0 flex-grow-1 d-flex flex-column"
        >
            <!-- Chat list -->
            <v-list-item-group
                v-model="activatedConv"
                class="conversation-list flex-grow-1 overflow-y-auto"
            >
                <Conversation
                    :conversation="chat"
                    v-for="chat in convList"
                    :key="chat.id || chat._id"
                    @click="onSelect(chat)"
                />
            </v-list-item-group>
        </v-list>
    </v-sheet>
</template>

<script>
import { fillHeight } from "../../utils/layout.js";
import UserAvatar from "../../components/avatar/user-avatar.vue";
import Conversation from "../../components/conversation-item.vue";
export default {
    props: {
        list: Array,
        activatedItem: Object,
        channel: {
            type: Boolean,
            default: false,
        },
    },
    components: { UserAvatar, Conversation },
    data() {
        return {
            searchText: null,
            convList: [],
            activatedConv: null,
            allowAddChannel: false
        };
    },
    watch: {
        searchText() {
            this.searchLocker.then(this.searchConversation);
        },
        "activatedItem.id"() {
            // To support change tmp conversation to real
            this.updateUrlQuery();
        },
        activatedItem() {
            this.activatedConv = this.activatedItem;
            this.updateUrlQuery();
        },
        activatedConv(val) {
            if (val && val != this.activatedItem) {
                this.$store.dispatch(
                    "conversations/activeChat",
                    val.id || val._id
                );
            } else if (!this.activatedConv && this.activatedItem) {
                this.$nextTick(() => {
                    // Fix bug cannot activate the last conv after changing conv.id (conv._id)
                    this.activatedConv = this.convList.find(
                        i => i.id == this.activatedItem.id
                    );
                });
            }
        },
    },
    created() {
        // Init data
        this.convList = this.list;
        this.activatedConv = this.activatedItem;
        this.searchLocker = Promise.resolve();

        // Update route
        if (this.$route.query._status === "temp") {
            this.$router.updateQuery({});
        } else if (this.$route.query._id) {
            // Load the last conversation
            return this.$store
                .dispatch("conversations/activeChat", this.$route.query._id)
                .then(chat => {
                    if (!chat) {
                        this.$router.updateQuery({});
                    }
                })
                .catch(err => {
                    console.error(err);
                    this.$router.updateQuery({});
                });
        } else if (this.list.length > 0 && !this.activatedConv) {
            // Set default conversation
            this.activatedConv = this.list[0];
        }

        // TODO: SEtup back-door
        window.allowAddChannel = () => {
            this.allowAddChannel = true;
        }
    },
    mounted() {
        fillHeight("conversation-list", 0, this.$el);
        this.updateUrlQuery();
    },
    activated() {
        setTimeout(this.updateUrlQuery, 0);
    },
    methods: {
        onSelect(chat) {
            if (this.activatedConv) {
                if (
                    (chat.id && this.activatedConv.id == chat.id) ||
                    this.activatedConv._id == chat._id
                ) {
                    return;
                }
            }

            // Incase user re-open existing chat
            return this.$store.dispatch(
                "conversations/activeChat",
                chat.id || chat._id
            ).catch(console.warn);
        },
        onAddConv() {
            this.$emit("add");
        },
        updateUrlQuery() {
            if (this.activatedConv) {
                const convId = this.activatedConv.id || this.activatedConv._id;
                if (convId != this.$route.query._id) {
                    const newQuery = { ...this.$route.query };
                    delete newQuery._status;
                    if (this.activatedConv._isTemp == true) {
                        newQuery._status = "temp";
                    }
                    newQuery._id = convId;
                    this.$router.updateQuery(newQuery);
                }
            } else if (this.$route.query._id) {
                this.$router.updateQuery({});
            }
        },
        searchConversation() {
            if (!this.searchText) {
                this.searchLocker = Promise.resolve();
                this.convList = this.list;
                this.activatedConv = this.activatedItem;
                return;
            }

            // Request searching
            this.searchLocker = new Promise(resolve => {
                const list = this.list.filter(conv =>
                    conv.name
                        .toLowerCase()
                        .includes(this.searchText.toLowerCase())
                );
                resolve(list);
            }).then(list => {
                this.convList = list;
            });
        },
    },
};
</script>

<style scoped>
#chat-list >>> .v-text-field--solo .v-input__control {
    min-height: 36px !important;
    border: 1px solid rgba(0, 0, 0, 0.12);
}

#chat-list >>> .theme--dark.v-text-field--solo .v-input__control {
    border: 1px solid rgba(255, 255, 255, 0.12);
}

.v-item-group.v-list-item-group {
    width: 100%;
}
</style>

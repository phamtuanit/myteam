<template>
    <v-sheet
        width="280px" min-width="280px"
        class="pa-0 fill-height no-border-radius d-flex flex-column"
        id="chat-list"
    >
        <v-sheet height="57" class="pa-0 center-y no-border-radius px-3">
            <!-- Search -->
            <v-text-field
                v-model="searchText"
                prepend-inner-icon="mdi-magnify"
                label="Conversation"
                name="search-conversation"
                flat
                solo
                hide-details
                clearable
                clear-icon="mdi-close"
                @keyup.esc="searchText = ''"
            ></v-text-field>
        </v-sheet>
        <v-divider></v-divider>

        <div class="px-0 py-1 ma-0 center-y justify-sm-space-between">
            <v-subheader class="pl-3 pr-2 selection-disabled"
                >Conversations</v-subheader
            >

            <!-- Add btn -->
            <v-btn v-if="allowAdd" icon class="ml-1 mr-2" rounded>
                <v-icon>mdi-plus</v-icon>
            </v-btn>
        </div>

        <!-- List -->
        <v-list two-line class="py-0 px-0 flex-grow-1 d-flex flex-column">
            <!-- Chat list -->
            <v-list-item-group
                v-model="activatedConv"
                class="conversation-list flex-grow-1 overflow-y-auto"
            >
                <v-list-item
                    v-for="chat in convList"
                    :key="chat.id || chat._id"
                    :value="chat"
                    @click="onSelect(chat)"
                >
                    <Conversation :conversation="chat" />
                </v-list-item>
            </v-list-item-group>
        </v-list>
    </v-sheet>
</template>

<script>
import { fillHeight } from "../../utils/layout.js";
import UserAvatar from "../../components/user-avatar.vue";
import Conversation from "../../components/conversation-item.vue";
export default {
    props: {
        list: Array,
        activated: Object,
        allowAdd: {
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
        };
    },
    watch: {
        searchText() {
            this.searchLocker.then(this.searchConversation);
        },
        "activated.id"() {
            // To support change tmp conversation to real
            this.updateUrlQuery();
        },
        activated() {
            this.activatedConv = this.activated;
            this.updateUrlQuery();
        },
        activatedConv(val) {
            if (val && val != this.activated) {
                this.$store.dispatch(
                    "conversations/activeChat",
                    val.id || val._id
                );
            } else if (!this.activatedConv) {
                this.$nextTick(() => {
                    // Fix bug cannot activate the last conv after changing conv.id (conv._id)
                    this.activatedConv = this.convList.find(
                        i => i.id == this.activated.id
                    );
                });
            }
        },
    },
    created() {
        // Init data
        this.convList = this.list;
        this.activatedConv = this.activated;
        this.searchLocker = Promise.resolve();

        // Update route
        if (this.$route.query._status == "temp") {
            this.$router.updateQuery({});
        } else if (this.$route.query._id) {
            // Load the last conversation
            return this.$store
                .dispatch("conversations/activeChat", this.$route.query._id)
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
        } else if (this.list.length > 0 && !this.activatedConv) {
            // Set default conversation
            this.activatedConv = this.list[0];
        }
    },
    mounted() {
        fillHeight("conversation-list", 0, this.$el);

        // Update url query
        if (!this.$route.query._id && this.activatedConv) {
            const currentId = this.activatedConv.id || this.activatedConv._id;
            const newQuery = { ...this.$route.query };
            newQuery._id = currentId;
            this.$router.updateQuery(newQuery);
        }
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
            this.$store.dispatch(
                "conversations/activeChat",
                chat.id || chat._id
            );
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
                this.activatedConv = this.activated;
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
<template>
  <v-sheet
    width="280px"
    class="pa-0 fill-height no-border-radius"
    dark
    id="chat-list"
  >
    <!-- Search -->
    <v-list
      dense
      dark
      class="pb-2"
    >
      <div class="px-3">
        <v-text-field
          v-model="searchText"
          prepend-inner-icon="mdi-magnify"
          label="Conversation"
          name="search-chat"
          flat
          solo-inverted
          rounded
          hide-details
          clearable
          clear-icon="mdi-close"
          @keyup.esc="searchText = ''"
        ></v-text-field>
      </div>
    </v-list>

    <!-- List -->
    <v-list
      two-line
      dark
      height="200"
      class="py-0 px-0"
    >
      <v-subheader class="pl-3 pr-2 selection-disabled">Conversations</v-subheader>
      <v-layout
        class="conversation-list"
        style="overflow-y: auto;"
      >
        <!-- Chat list -->
        <v-list-item-group
          v-model="activatedChat"
          mandatory
        >
          <!-- <v-slide-y-transition group> -->
          <v-list-item
            v-for="chat in chatList"
            :key="chat.id || chat._id"
            :value="chat"
            @click="onSelect(chat)"
          >
            <Conversation :conversation="chat" />
          </v-list-item>
          <!-- </v-slide-y-transition> -->
        </v-list-item-group>
      </v-layout>
    </v-list>
  </v-sheet>
</template>

<script>
import { fillHeight } from "../../utils/layout.js";
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
                    return this.$store.dispatch(
                        "chats/activeChat",
                        val.id || val._id
                    );
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
        "activatedChat.id"() {
            // To support change tmp conversation to real
            this.updateUrlQuery();
        },
        activatedChat() {
            this.updateUrlQuery();
        },
    },
    created() {
        this.eventBus = window.IoC.get("bus");
        if (this.$route.query._status == "temp") {
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
        fillHeight("conversation-list", 0, this.$el);
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
            if (
                this.activatedChat.id == chat.id ||
                this.activatedChat._id == chat._id
            ) {
                return;
            }

            // Incase user re-open existing chat
            this.$store.dispatch("chats/activeChat", chat.id);
        },
        updateUrlQuery() {
            if (this.activatedChat) {
                const convId = this.activatedChat.id || this.activatedChat._id;
                if (convId != this.$route.query._id) {
                    const newQuery = { ...this.$route.query };
                    delete newQuery._status;
                    if (this.activatedChat._isTemp == true) {
                        newQuery._status = "temp";
                    }
                    newQuery._id = convId;
                    this.$router.updateQuery(newQuery);
                }
            } else {
                this.$router.updateQuery({});
            }
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

.v-item-group.v-list-item-group {
    width: 100%;
}
</style>

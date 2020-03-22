<template>
  <v-sheet
    width="300px"
    class="pa-0 fill-height no-border-radius"
    dark
    id="chat-list"
  >
    <!-- Search -->
    <v-list
      dense
      dark
      class="pb-0"
    >
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
        <v-btn
          icon
          size="40"
          outlined
          class="ml-2"
          @click="onAddChat"
        >
          <v-icon v-text="plusIcon"></v-icon>
        </v-btn>
      </v-list-item>
    </v-list>

    <!-- List -->
    <v-list
      two-line
      dark
      class="py-0 px-0"
    >
      <v-subheader
        class="pl-3 pr-2"
        v-text="title"
      ></v-subheader>
      <v-progress-linear
        :active="loading"
        :indeterminate="true"
      ></v-progress-linear>

      <v-list-item-group v-if="displayMode == 'friend'">
        <!-- Friend list -->
        <template v-for="friend in friendList">
          <v-list-item
            :key="friend.id"
            v-if="!friend._isMe"
            @click="openChat(null, friend)"
          >
            <v-avatar size="30">
              <v-img src="https://randomuser.me/api/portraits/men/81.jpg"></v-img>
            </v-avatar>

            <v-list-item-content class="py-2 px-2">
              <v-list-item-title
                class="body-2"
                v-text="`${friend.firstname}, ${friend.lastname}`"
              ></v-list-item-title>
              <v-list-item-subtitle
                class="caption"
                v-text="friend.mail"
              ></v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>

        </template>
      </v-list-item-group>

      <!-- Chat list -->
      <v-list-item-group
        v-else
        v-model="activatedChat"
      >
        <v-list-item
          v-for="chat in chatList"
          :key="chat.id"
          :value="chat"
          @click="openChat(chat, chat.user)"
        >
          <v-avatar size="30">
            <v-img src="https://randomuser.me/api/portraits/men/81.jpg"></v-img>
          </v-avatar>

          <v-list-item-content class="py-2 px-2">
            <v-list-item-title
              class="body-2"
              v-text="getChatName(chat)"
            ></v-list-item-title>
            <v-list-item-subtitle
              class="caption"
              v-text="chat.recentMessage"
            ></v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list-item-group>
    </v-list>
  </v-sheet>
</template>

<script>
import { mapState } from "vuex";
export default {
    data() {
        return {
            loading: false,
            searchText: null,
            displayMode: "chat",
            friendList: [],
        };
    },
    computed: {
        title() {
            return this.displayMode == "chat" ? "Conversations" : "Friends";
        },
        plusIcon() {
            return "mdi-" + (this.displayMode == "chat" ? "plus" : "close");
        },
        ...mapState({
            chatList: state => state.chats.all,
            cachedUsers: state => Object.values(state.users.all),
        }),
        activatedChat: {
            get() {
                return this.$store.state.chats.active;
            },
            set(val) {
                return this.$store.dispatch("chats/activeChat", val.id);
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
                this.displayMode == "chat";
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
    },
    methods: {
        openChat(chat, friend) {
            if (!chat) {
                if (this.selectedItem == friend) {
                    return;
                }

                // Incase user selected a chat in friend list
                const newQuery = { ...this.$route.query };
                newQuery._id = friend.id;
                newQuery._status = "temp";
                this.$router.updateQuery(newQuery);
            } else {
                if (this.activatedChat.id == chat.id) {
                    return;
                }

                // Incase user re-open existing chat
                this.$store.dispatch("chats/activeChat", chat.id);
            }
        },
        onAddChat() {
            if (this.displayMode == "chat") {
                this.displayMode = "friend";
                if (!this.searchText) {
                    this.friendList = this.cachedUsers;
                } else {
                    this.searchLocker.then(this.searchFriend);
                }
            } else {
                this.displayMode = "chat";
            }
        },
        searchFriend() {
            if (!this.searchText) {
                this.searchLocker = Promise.resolve();
                return;
            }

            // Delay loading
            const timmer = setTimeout(() => {
                this.loading = true;
            }, 2 * 1000);

            // Request searching
            this.searchLocker = this.$store
                .dispatch("users/findUser", this.searchText)
                .then(users => {
                    this.friendList = users;
                })
                .catch(console.error)
                .finally(() => {
                    clearTimeout(timmer);
                    this.loading = false;
                    this.searchLocker = Promise.resolve();
                });
        },
        getChatName(chat) {
            if (chat.name) {
                return chat.name;
            }

            const friends = chat.subscribers
                .filter(user => !user._isMe)
                .map(user => user.firstname + ", " + user.lastname);
            return friends.join(", ");
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

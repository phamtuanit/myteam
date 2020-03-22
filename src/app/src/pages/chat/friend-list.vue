<template>
  <v-sheet
    id="friend-list"
    width="220px"
    class="pa-0 fill-height no-border-radius"
  >
    <!-- Search -->
    <v-list
      dense
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
      </v-list-item>
    </v-list>

    <!-- Friends -->
    <v-list
      two-line
      class="py-0 px-0"
    >
      <v-subheader class="pl-3 pr-2">Friends</v-subheader>

      <v-progress-linear
        :active="loading"
        :indeterminate="true"
      ></v-progress-linear>

      <!-- List -->
      <template v-for="user in friendList">
        <v-list-item
          :key="user.id"
          v-if="!user._isMe"
          @click="openChat(user)"
        >
          <v-avatar size="30">
            <v-img src="https://randomuser.me/api/portraits/men/81.jpg"></v-img>
          </v-avatar>

          <v-list-item-content class="py-2 px-2">
            <v-list-item-title
              class="body-2"
              v-text="getDisplayName(user)"
            ></v-list-item-title>
            <v-list-item-subtitle
              class="caption"
              v-text="user.mail"
            ></v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </template>
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
            friendList: [],
        };
    },
    computed: {
        ...mapState({
            cachedUsers: state => state.users.all,
        }),
    },
    watch: {
        searchText() {
            this.searchLocker.then(this.searchFriend);
        },
    },
    mounted() {
        this.searchLocker = Promise.resolve();
        this.friendList = this.cachedUsers;
    },
    methods: {
        openChat(user) {
            const existingChat = this.$store.state.chats.all.find(chat => {
                if (chat.subscribers && chat.subscribers.length == 2) {
                    const matchedSub = chat.subscribers.filter(sub => {
                        return sub._isMe == true || sub.id == user.id;
                    });

                    return matchedSub.length == 2;
                }
                return false;
            });

            if (existingChat) {
                // Active exsiting chat
                this.$store.dispatch("chats/activeChat", existingChat.id);
                return;
            }

            // Create new conversation first
            this.$store
                .dispatch("chats/createChat", user.id)
                .catch(console.error);
        },
        searchFriend() {
            if (!this.searchText) {
                this.searchLocker = Promise.resolve();
                this.friendList = this.cachedUsers;
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
        getDisplayName(user) {
            return user.firstname + ", " + user.lastname;
        },
    },
};
</script>

<style scoped>
#friend-list >>> .v-text-field.v-text-field--solo .v-input__control {
    min-height: 40px !important;
}

#friend-list >>> .v-text-field--rounded > .v-input__control > .v-input__slot {
    padding: 0 16px;
}

#friend-list >>> .v-text-field--rounded {
    border-radius: 20px;
}
</style>
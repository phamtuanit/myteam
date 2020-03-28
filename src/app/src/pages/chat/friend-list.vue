<template>
  <v-sheet
    id="friend-list"
    width="250px"
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
          @keyup.esc="searchText = ''"
        ></v-text-field>
      </v-list-item>
    </v-list>

    <!-- Friends -->
    <v-list
      two-line
      class="mt-2 py-0 px-0"
    >

      <v-progress-linear
        :active="loading"
        :indeterminate="true"
      ></v-progress-linear>

      <v-layout
        class="friend-list"
        style="overflow-y: auto;"
      >
        <!-- List -->
        <v-slide-y-transition
          group
          tag="div"
        >
          <template v-for="user in friendList">
            <v-list-item
              :key="user.id"
              v-if="!user._isMe"
              @click="onAddChat(user)"
            >
              <UserAvatar
                :user-name="me.fullName"
                :user="user"
                online-effect
              />

              <v-list-item-content class="py-2 pl-3 pr-2">
                <v-list-item-title
                  class="body-2"
                  v-text="getDisplayName(user)"
                ></v-list-item-title>
                <v-list-item-subtitle
                  v-if="user.phone"
                  class="caption"
                >&#128222; {{user.phone}}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </template>
        </v-slide-y-transition>
      </v-layout>
    </v-list>
  </v-sheet>
</template>

<script>
import { fillHeight } from "../../utils/layout.js";
import { mapState } from "vuex";
import UserAvatar from "../../components/user-avatar.vue";
export default {
    components: { UserAvatar },
    data() {
        return {
            loading: false,
            searchText: null,
            friendList: [],
        };
    },
    computed: {
        ...mapState({
            me: state => state.users.me,
            cachedUsers: state => state.users.all,
        }),
    },
    watch: {
        searchText() {
            this.searchLocker.then(this.searchFriend);
        },
    },
    mounted() {
        fillHeight("friend-list", 0, this.$el);
        this.searchLocker = Promise.resolve();
        this.friendList = this.cachedUsers;
    },
    methods: {
        onAddChat(selectedUser) {
            const existingChat = this.$store.state.chats.all.find(chat => {
                if (chat.subscribers && chat.subscribers.length == 2) {
                    const matchedSub = chat.subscribers.filter(sub => {
                        return sub._isMe == true || sub.id == selectedUser.id;
                    });

                    return matchedSub.length == 2;
                }
                return false;
            });

            if (existingChat) {
                // Active exsiting chat
                this.$store
                    .dispatch("chats/activeChat", existingChat.id)
                    .catch(console.error);
                return;
            }

            // Create new conversation first
            this.$store
                .dispatch("chats/activeTmpChat", selectedUser)
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
            return user.fullName || user.firstName + ", " + user.lastName;
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

/* Scroll */
.friend-list > div {
    width: 100%;
}

.v-list-item__content {
    max-width: 218px;
}
</style>

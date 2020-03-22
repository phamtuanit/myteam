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

      <v-list-item-group v-model="selectedConv">
        <v-list-item
          v-for="conv in conversations"
          :key="conv.user.id"
          @click="openChat()"
        >
          <v-avatar size="30">
            <v-img src="https://randomuser.me/api/portraits/men/81.jpg"></v-img>
          </v-avatar>

          <v-list-item-content class="py-2 px-2">
            <v-list-item-title
              class="body-2"
              v-text="conv.name"
            ></v-list-item-title>
            <v-list-item-subtitle
              class="caption"
              v-text="conv.additional"
            ></v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list-item-group>
    </v-list>
  </v-sheet>
</template>

<script>
// import { fillHeight } from "../utils/layout.js";
export default {
    data() {
        return {
            loading: false,
            selectedConv: null,
            searchText: null,
            displayMode: "chat",
            conversations: [],
        };
    },
    computed: {
        title() {
            return this.displayMode == "chat" ? "Conversations" : "Friends";
        },
        plusIcon() {
            return "mdi-" + (this.displayMode == "chat" ? "plus" : "close");
        },
    },
    watch: {
        searchText(val) {
            if (this.displayMode == "friend") {
                if (val) {
                    this.searchLocker.then(this.searchFriend);
                }
            }
        },
    },
    mounted() {
        this.searchLocker = Promise.resolve();
    },
    methods: {
        openChat() {},
        onAddChat() {
            // Reset search
            this.searchText = "";

            if (this.displayMode == "chat") {
                // Backup data
                this.conversationsBackup = this.conversations;
                this.displayMode = "friend";
            } else {
                this.displayMode = "chat";
                // Restore data
                this.conversations = this.conversationsBackup;
            }
        },
        searchFriend() {
            if (!this.searchText) {
                this.conversations = [];
                this.searchLocker = Promise.resolve();
                return;
            }

            this.loading = true;
            this.searchLocker = this.$store
                .dispatch("users/findUser", this.searchText)
                .then(users => {
                    this.conversations = [];
                    if (users) {
                        users.forEach(user => {
                            this.conversations.push({
                                name: user.firstname + ", " + user.lastname,
                                user: user,
                                additional: user.status,
                            });
                        });
                    }
                })
                .catch(console.error)
                .finally(() => {
                    this.loading = false;
                    this.searchLocker = Promise.resolve();
                });
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

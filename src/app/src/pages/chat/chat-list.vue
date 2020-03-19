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
        <v-btn icon size="40" outlined class="ml-2" @click="onAddChat">
          <v-icon v-text="plusIcon"></v-icon>
        </v-btn>
      </v-list-item>
    </v-list>

    <!-- List -->
    <v-list two-line dark class="py-0 px-0">
      <v-subheader class="pl-3 pr-2" v-text="title"></v-subheader>
      <v-progress-linear
        :active="loading"
        :indeterminate="true"
      ></v-progress-linear>

      <v-list-item-group v-model="selectedConv">
        <!-- 1 -->
        <v-list-item @click="openChat()">
          <v-avatar size="30">
            <v-img src="https://randomuser.me/api/portraits/men/81.jpg"></v-img>
          </v-avatar>

          <v-list-item-content class="py-2 px-2">
            <v-list-item-title class="body-2">Jon Son</v-list-item-title>
            <v-list-item-subtitle class="caption"
              >Can I help you? It seems that you facce a big
              problem.</v-list-item-subtitle
            >
          </v-list-item-content>
        </v-list-item>

        <!-- 2 -->
        <v-list-item @click="openChat()">
          <v-avatar size="30">
            <v-img src="https://randomuser.me/api/portraits/men/41.jpg"></v-img>
          </v-avatar>

          <v-list-item-content class="py-2 px-2">
            <v-list-item-title class="body-2">Wilance Joy</v-list-item-title>
            <v-list-item-subtitle class="caption"
              >Can I help you? It seems that you facce a big
              problem.</v-list-item-subtitle
            >
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
      displayMode: "chat"
    };
  },
  computed: {
    title() {
      return this.displayMode == "chat" ? "Conversations" : "Friends";
    },
    plusIcon() {
      return "mdi-" + (this.displayMode == "chat" ? "plus" : "close");
    }
  },
  mounted() {
    // fillHeight(this.$el, 0);
  },
  methods: {
    openChat() {},
    onAddChat() {
      // Reset search
      this.searchText = "";

      if (this.displayMode == "chat") {
        this.displayMode = "friend";
        // Backup data
        this.conversationsBackup = this.conversations;
        this.loading = true;
        this.loadFriendList()
          .then(list => {
            this.conversations = list || [];
          })
          .finally(() => {
            this.loading = false;
          });
      } else {
        this.displayMode = "chat";
        // Restore data
        this.conversations = this.conversationsBackup;
      }
    },
    loadFriendList() {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve([]);
        }, 2 * 1000);
      });
    }
  }
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

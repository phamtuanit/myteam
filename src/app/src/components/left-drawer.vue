<template>
  <v-navigation-drawer
    permanent
    mini-variant
    dark
    app
    mini-variant-width="66"
    color="primary-bg"
  >
    <v-list-item class="px-0 mt-2 mb-1">
      <v-avatar size="40" class="mx-auto">
        <v-img src="https://randomuser.me/api/portraits/men/85.jpg"></v-img>
      </v-avatar>
    </v-list-item>
    <!-- Chat -->
    <v-list-item class="px-0 mt-3">
      <v-badge overlap color="red darken-3" light content="8">
        <v-tooltip right>
          <template v-slot:activator="{ on }">
            <v-btn icon v-on="on">
              <v-icon color="white">mdi-forum-outline</v-icon>
            </v-btn>
          </template>
          <span>Chat</span>
        </v-tooltip>
      </v-badge>
    </v-list-item>
    <!-- Group -->
    <v-list-item class="px-0 mt-2">
      <v-badge overlap color="red darken-3" light content="1">
        <v-tooltip right>
          <template v-slot:activator="{ on }">
            <v-btn icon v-on="on">
              <v-icon color="white">mdi-account-group</v-icon>
            </v-btn>
          </template>
          <span>Group</span>
        </v-tooltip>
      </v-badge>
    </v-list-item>
    <template v-slot:append>
      <div class="pa-2 text-center">
        <v-btn icon @click="enableDarkMode" title="Dark / Light">
          <v-icon>mdi-theme-light-dark</v-icon>
        </v-btn>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script>
export default {
  data() {
    return {
      theme: window.IoC.get("theme")
    };
  },
  methods: {
    enableDarkMode() {
      this.theme.dark = !this.theme.dark;
    }
  }
};
</script>

<style>
</style>

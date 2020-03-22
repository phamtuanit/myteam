<template>
  <v-navigation-drawer
    permanent
    mini-variant
    dark
    app
    mini-variant-width="70"
    class="left-drawer"
  >
    <v-list-item class="px-0 mt-2 mb-1 mx-auto">
      <v-avatar
        size="40"
        class="mx-auto"
      >
        <v-img src="https://randomuser.me/api/portraits/men/85.jpg"></v-img>
      </v-avatar>
    </v-list-item>
    <v-list>
      <v-list-item-group mandatory>
        <template v-for="menu in menus">
          <v-list-item
            :key="menu.key"
            :value="menu"
            :input-value="menu == activatedMenu"
            class="px-0 my-0 pb-3 pt-4"
            @click="onActivateMenu(menu)"
          >
            <v-badge
              :value="menu.inform.count > 0"
              :key="menu.key + 'badge'"
              overlap
              color="red darken-3"
              light
              :content="menu.inform.count"
            >
              <v-tooltip right>
                <template v-slot:activator="{ on }">
                  <v-icon
                    color="white"
                    v-on="on"
                    class="mx-auto pa-1"
                  >mdi-{{ menu.icon }}</v-icon>
                </template>
                <span>{{ menu.name }}</span>
              </v-tooltip>
            </v-badge>
          </v-list-item>
        </template>
      </v-list-item-group>
    </v-list>
    <template v-slot:append>
      <div class="pa-2 text-center">
        <v-btn
          icon
          @click="enableDarkMode"
          title="Dark / Light"
        >
          <v-icon>mdi-theme-light-dark</v-icon>
        </v-btn>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script>
import menus from "../conf/main-nav";
export default {
    data() {
        return {
            theme: window.IoC.get("theme"),
            activatedMenu: null,
            menus: menus,
        };
    },
    mounted() {
        this.activateDefaultMenu();
    },
    methods: {
        enableDarkMode() {
            try {
                const theme = this.theme;
                theme.dark = !theme.dark;
                this.$store
                    .dispatch("setTheme", theme)
                    .then(() => {
                        this.$vuetify.theme.dark = theme.dark;
                    })
                    .catch(console.error);
            } catch (error) {
                console.error("Could not change Dark mode", error);
            }
        },
        activateDefaultMenu() {
            const currRouteName = this.$route.name;
            // Lookup route from uri
            const matchedMenu = this.menus.find(item => {
                return item.route && item.route.name == currRouteName;
            });

            if (matchedMenu) {
                this.onActivateMenu(matchedMenu);
                return;
            }

            //  In case could not find menu from uri, trying to find them in menu definition
            const defaultContext = this.menus.find(item => {
                return item.default == true;
            });
            if (defaultContext) {
                this.onActivateMenu(defaultContext);
            }
        },
        onActivateMenu(menu) {
            if (this.activatedMenu == menu) {
                return;
            }

            if (menu.route.name === this.$route.name) {
                return;
            }

            if (menu.route) {
                this.$router
                    .push(menu.route)
                    .then(() => {
                        this.activatedMenu = menu;
                    })
                    .catch(console.error);
            }
        },
    },
};
</script>

<style scoped>
.left-drawer {
    background-color: var(--primary-color) !important;
}
</style>

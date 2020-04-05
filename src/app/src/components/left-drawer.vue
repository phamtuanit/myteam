<template>
  <v-navigation-drawer
    permanent
    mini-variant
    dark
    app
    mini-variant-width="70"
    class="left-drawer bg-1"
  >
    <!-- Self Avatar -->
    <v-list-item class="px-0 mt-2 mb-1 mx-auto">
      <Avatar
        :size="40"
        :user-name="me.fullName"
        class="mx-auto"
        :src="me.avatar"
      >
      </Avatar>
    </v-list-item>

    <!-- Menus -->
    <v-list>
      <template v-for="menu in menus">
        <v-list-item
          :key="menu.key"
          :value="menu"
          :input-value="menu.key == activatedMenu.key"
          class="px-0 my-0 pb-3 pt-4"
          @click="onActivateMenu(menu)"
        >
          <v-badge
            :value="menu.inform && menu.inform.count > 0"
            :key="menu.key + 'badge'"
            overlap
            color="red darken-3"
            light
            :dot="menu.inform && menu.inform.count > 99"
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
    </v-list>

    <!-- Dark mode -->
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
import { mapState } from "vuex";

import Avatar from "./avatar";
export default {
    components: { Avatar },
    data() {
        return {
            theme: window.IoC.get("theme"),
            activatedMenu: null,
            menus: menus,
        };
    },
    computed: {
        ...mapState({
            me: state => state.users.me,
        }),
    },
    watch: {
        activatedMenu(val) {
            if (val && val.inform) {
                val.inform.count = 0;
            }
        },
    },
    mounted() {
        this.activateDefaultMenu();
        this.setUpEvent();
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
                this.activatedMenu = menu;
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
        setUpEvent() {
            const bus = window.IoC.get("bus");
            bus.on("drawer.inform", payload => {
                const sender = payload.sender;
                if (
                    this.activatedMenu.route &&
                    this.activatedMenu.route.name == sender
                ) {
                    console.debug(
                        "The module is avtivated. Ignore information.",
                        payload
                    );
                    return;
                }

                if (
                    !payload.inform ||
                    typeof payload.inform.count != "number"
                ) {
                    console.warn(
                        "Information doesn't include required inforamtion.",
                        payload
                    );
                    return;
                }

                const menu = this.menus.find(
                    me => me.route && me.route.name == sender
                );
                if (
                    menu &&
                    menu.inform &&
                    typeof menu.inform.count == "number"
                ) {
                    menu.inform.count += payload.inform.count;
                }
            });
        },
    },
};
</script>

<style scoped>
</style>

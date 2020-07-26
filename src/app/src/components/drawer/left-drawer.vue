<template>
    <v-navigation-drawer
        permanent
        mini-variant
        dark
        app
        mini-variant-width="65"
        id="left-drawer"
        class="bg-1"
    >
        <!-- Self Avatar -->
        <v-list-item class="px-0 mt-2 mb-1 mx-auto">
            <v-menu :close-on-content-click="true">
                <template v-slot:activator="{ on }">
                    <Avatar
                        :size="40"
                        v-on="on"
                        :user-name="me.fullName"
                        class="mx-auto user-avatar"
                        :src="me.avatar"
                    >
                    </Avatar>
                </template>

                <v-card class="px-2">
                    <v-list>
                        <v-list-item class="px-2">
                            <v-list-item-avatar>
                                <Avatar
                                    :size="48"
                                    :user-name="me.fullName"
                                    class="mx-auto"
                                    :src="me.avatar"
                                ></Avatar>
                            </v-list-item-avatar>

                            <v-list-item-content>
                                <v-list-item-title
                                    v-if="me.firstName && me.lastName"
                                >
                                    {{ me.firstName }},
                                    {{ me.lastName }}
                                </v-list-item-title>
                                <v-list-item-subtitle>
                                    {{ me.mail }}
                                </v-list-item-subtitle>
                            </v-list-item-content>
                        </v-list-item>
                    </v-list>

                    <v-divider></v-divider>
                    <!-- Action -->
                    <v-card-actions>
                        <!-- Dark mode -->
                        <v-btn
                            icon
                            @click="enableDarkMode"
                            title="Dark / Light"
                        >
                            <v-icon>mdi-theme-light-dark</v-icon>
                        </v-btn>
                        <v-spacer></v-spacer>
                        <!-- Logout -->
                        <v-btn class="color-1" text @click="onLogout"
                            >Logout</v-btn
                        >
                    </v-card-actions>
                </v-card>
            </v-menu>
        </v-list-item>

        <!-- Menus -->
        <v-list>
            <template v-for="menu in menus">
                <v-list-item
                    :key="menu.key"
                    :value="menu"
                    :input-value="menu == activatedMenu"
                    class="px-0 my-0 pb-3 pt-3"
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
                                    >mdi-{{ menu.icon }}</v-icon
                                >
                            </template>
                            <span>{{ menu.name }}</span>
                        </v-tooltip>
                    </v-badge>
                </v-list-item>
            </template>
        </v-list>

        <!-- Footer -->
        <!-- <template v-slot:append>
        </template> -->
    </v-navigation-drawer>
</template>

<script>
import menus from "../../conf/main-nav";
import { mapState } from "vuex";

import Avatar from "../avatar/avatar.vue";
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
            chatUnreadMessages: state => state.conversations.chat.unread,
            channelUread: state => state.conversations.channel.unread,
        }),
    },
    watch: {
        chatUnreadMessages() {
            this.updateChatInformation();
        },
        channelUread() {
            this.updateConversationInformation();
        },
        "$route.name"(name) {
            const matchedMenu = this.menus.find(item => {
                return item.route.name === name;
            });
            if (matchedMenu) {
                this.onActivateMenu(matchedMenu);
            }
        },
    },
    created() {
        this.auth = window.IoC.get("auth");
    },
    mounted() {
        this.activateDefaultMenu();
        this.updateInformation();
    },
    methods: {
        updateInformation() {
            this.updateChatInformation();
            this.updateConversationInformation();
        },
        updateConversationInformation() {
            const menu = this.menus.find(
                me => me.route && me.route.name == "app-channel"
            );

            if (menu) {
                menu.inform = {
                    count: this.channelUread.length,
                };

                if (this.channelUread.length > 0) {
                    window.IoC.get("ipc").send("set-flash-frame", true);
                }
            }
        },
        updateChatInformation() {
            const menu = this.menus.find(
                me => me.route && me.route.name == "app-chat"
            );

            if (menu) {
                menu.inform = {
                    count: this.chatUnreadMessages.length,
                };

                if (this.chatUnreadMessages.length > 0) {
                    window.IoC.get("ipc").send("set-flash-frame", true);
                }
            }
        },
        enableDarkMode() {
            try {
                const theme = this.theme;
                theme.dark = !theme.dark;
                this.$store
                    .dispatch("setTheme", theme)
                    .then(() => {
                        this.$vuetify.theme.dark = theme.dark;

                        // Update root element
                        document.body.dataset.themeDark = theme.dark;
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
                if (menu.route.link) {
                    window.open(menu.route.link, '_blank');
                } else {
                    this.$router
                        .push(menu.route)
                        .then(() => {
                            this.activatedMenu = menu;
                        })
                        .catch(console.error);
                }
            }
        },
        onLogout() {
            this.auth
                .logout()
                .then(() => {
                    // Refresh page
                    window.history.pushState({}, document.title, "/");
                    // this.$router.go(0);
                    location.reload();
                })
                .catch(console.error);
        },
    },
};
</script>

<style>
#left-drawer .user-avatar {
    cursor: pointer;
}

#left-drawer.v-navigation-drawer .v-navigation-drawer__border {
    background-color: transparent !important;
    width: 0px;
}
</style>

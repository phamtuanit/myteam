<template>
    <v-sheet
        id="friend-list"
        width="250px"
        class="pa-0 fill-height no-border-radius"
    >
        <!-- Search -->
        <v-list dense class="pb-0">
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
                    class="ml-2"
                    outlined
                    @click="onAddChat"
                    :disabled="!selectedUser"
                >
                    <v-icon>mdi-plus</v-icon>
                </v-btn>
            </v-list-item>
        </v-list>

        <!-- Friends -->
        <v-list two-line class="py-0 px-0">
            <v-subheader class="pl-3 pr-2">Friends</v-subheader>

            <v-progress-linear
                :active="loading"
                :indeterminate="true"
            ></v-progress-linear>

            <!-- List -->
            <v-list-item-group v-model="selectedUser">
                <v-slide-y-transition group>
                    <template v-for="user in friendList">
                        <v-list-item
                            :key="user.id"
                            :value="user"
                            v-if="!user._isMe"
                        >
                            <UserAvatar
                                :user-name="me.fullName"
                                :user="user"
                                online-effect
                            />

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
                </v-slide-y-transition>
            </v-list-item-group>
        </v-list>
    </v-sheet>
</template>

<script>
import { mapState } from "vuex";
import UserAvatar from "../../components/user-avatar.vue";
export default {
    components: { UserAvatar },
    data() {
        return {
            selectedUser: null,
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
        this.searchLocker = Promise.resolve();
        this.friendList = this.cachedUsers;
    },
    methods: {
        onAddChat() {
            const user = this.selectedUser;
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
                this.$store
                    .dispatch("chats/activeChat", existingChat.id)
                    .then(() => {
                        this.selectedUser = null;
                    })
                    .catch(console.error);
                return;
            }

            // Create new conversation first
            this.$store
                .dispatch("chats/createChat", user.id)
                .then(() => {
                    this.selectedUser = null;
                })
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

#friend-list >>> .theme--light.v-btn {
    color: #043752c7;
}

#friend-list >>> .theme--light.v-btn--outlined {
    border: 1.5px solid #043752c7;
}

#friend-list >>> .theme--dark.v-btn--outlined {
    border: 1.5px solid #ffffffca;
}

#friend-list >>> .theme--light.v-btn--outlined.v-btn--disabled {
    border: 1.5px solid rgba(0, 0, 0, 0.26) !important;
}

#friend-list >>> .theme--dark.v-btn--outlined.v-btn--disabled {
    border: 1.5px solid rgba(255, 255, 255, 0.3) !important;
}
</style>

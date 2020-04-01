<template>
    <div id="friend-list" class="pa-0 fill-height d-flex flex-column">
        <!-- Search -->
        <v-sheet height="57" width="250" class="pa-0 center-y no-border-radius">
            <div class="px-3">
                <v-text-field
                    v-model="searchText"
                    prepend-inner-icon="mdi-magnify"
                    label="Friend"
                    flat
                    name="search-friend"
                    solo-inverted
                    rounded
                    hide-details
                    clearable
                    clear-icon="mdi-close"
                    @keyup.esc="searchText = ''"
                ></v-text-field>
            </div>
        </v-sheet>
        <v-divider></v-divider>

        <!-- Friends -->
        <v-list two-line class="py-0 px-0 flex-grow-1 d-flex flex-column">
            <v-progress-linear
                :active="loading"
                :indeterminate="true"
            ></v-progress-linear>

            <v-layout class="friend-list-layout overflow-y-auto">
                <!-- List -->
                <v-slide-y-transition group tag="div">
                    <template v-for="user in friendList">
                        <v-list-item
                            :key="user.id"
                            v-if="!user._isMe"
                            @click="onAddChat(user)"
                        >
                            <UserAvatar
                                :user-name="user.fullName"
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
                                    >&#128222;
                                    {{ user.phone }}</v-list-item-subtitle
                                >
                            </v-list-item-content>
                        </v-list-item>
                    </template>
                </v-slide-y-transition>
            </v-layout>
        </v-list>
    </div>
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
            cachedUsers: state => state.users.all,
        }),
    },
    watch: {
        searchText() {
            this.searchLocker.then(this.searchFriend);
        },
    },
    mounted() {
        fillHeight("friend-list-layout", 0, this.$el);
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
#friend-list {
    width: 250px;
}

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
.friend-list-layout > div {
    width: 100%;
}

.v-list-item__content {
    max-width: 218px;
}
</style>

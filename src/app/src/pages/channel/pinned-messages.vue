<template>
    <div class="pinned-message-list fill-height d-flex flex-column">
        <!-- Search -->
        <v-sheet class="pa-0 center-y no-border-radius">
            <v-subheader class="ml-0 selection-disabled"
                >Pinned messages
            </v-subheader>
            <v-spacer></v-spacer>
            <!-- <v-btn
                fab
                class="mr-3"
                rounded
                icon
                height="26"
                width="26"
                title="Clear all"
            >
                <v-icon>mdi-minus</v-icon>
            </v-btn> -->
        </v-sheet>
        <v-progress-linear
            :active="loading"
            :indeterminate="true"
        ></v-progress-linear>

        <!-- Messages -->
        <v-list class="py-0 px-0">
            <div class="friend-list-layout overflow-y-auto">
                <template v-for="user in friendList">
                    <div
                        :key="user.id"
                        @click="onAddChat(user)"
                        class="px-4 message-element"
                        :value="user.id"
                    >
                        <div class="d-flex flex-row py-2">
                            <UserAvatar
                                :user-name="user.fullName"
                                :user="user"
                                online-effect
                                class="align-self-start mt-1"
                            />
                            <div class="flex-grow-1 align-self-stretch ml-3">
                                <!-- Header -->
                                <div class="header d-flex selection-disabled">
                                    <span class="user-name subtitle-2">{{
                                        getDisplayName(user)
                                    }}</span>
                                    <span class="time caption">07/15/2020</span>
                                    <v-spacer></v-spacer>

                                    <v-btn
                                        fab
                                        class="mr-2"
                                        rounded
                                        icon
                                        height="26"
                                        width="26"
                                        title="Jump"
                                        @click="onJump"
                                    >
                                        <v-icon small class="action btn-jump"
                                            >mdi-ray-end-arrow</v-icon
                                        >
                                    </v-btn>
                                    <v-btn
                                        fab
                                        class="mr-1"
                                        rounded
                                        icon
                                        height="26"
                                        width="26"
                                        title="Unpin"
                                        @click="onUnpin"
                                    >
                                        <v-icon class="action btn-unpin"
                                            >mdi-minus</v-icon
                                        >
                                    </v-btn>
                                </div>

                                <!-- Content -->
                                <v-card-text class="pa-0 message-text"
                                    >Listen to your favorite artists and albums
                                    whenever and wherever, online and offline.
                                    With a simple conditional, you can easily
                                    add supplementary text that is hidden until
                                    opened.</v-card-text
                                >
                            </div>
                        </div>
                    </div>
                </template>
            </div>
        </v-list>
    </div>
</template>

<script>
import { fillHeight } from "../../utils/layout.js";
import { mapState } from "vuex";
import UserAvatar from "../../components/avatar/user-avatar.vue";
export default {
    components: { UserAvatar },
    data() {
        return {
            loading: false,
            friendList: [],
        };
    },
    computed: {
        ...mapState({
            cachedUsers: state => state.users.all,
        }),
    },
    mounted() {
        fillHeight("friend-list-layout", 0, this.$el);
        this.friendList = this.cachedUsers;
    },
    methods: {
        onUnpin(msg) {
            this.$emit("unpin", msg);
        },
        onJump(msg) {
            this.$emit("jump", msg);
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
    min-height: 36px !important;
    border: 1px solid rgba(0, 0, 0, 0.12);
}

#friend-list >>> .theme--dark.v-text-field--solo .v-input__control {
    border: 1px solid rgba(255, 255, 255, 0.12);
}

#friend-list >>> .v-list-item {
    min-height: 48px;
}

/* Scroll */
.friend-list-layout > div {
    width: 100%;
}

.v-list-item__content {
    max-width: 218px;
}
</style>
<style scoped>
.pinned-message-list {
    max-width: 500px;
}

.theme--light .message-text {
    color: rgba(0, 0, 0, 0.8);
}

.theme--dark .message-text {
    color: rgba(255, 255, 255, 0.7);
}

.user-name::after {
    content: "\2022";
    padding-left: 5px;
    padding-right: 5px;
    color: hsl(0, 0%, 72%);
}

.action {
    opacity: 0.2;
}

.message-element:hover .action {
    opacity: 1;
}
</style>

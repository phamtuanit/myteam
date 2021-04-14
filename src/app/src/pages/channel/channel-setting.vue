<template>
    <v-dialog
        v-model="display"
        persistent
        min-width="400"
        max-width="400"
        @keydown.esc="onClose"
    >
        <v-card>
            <!-- Header -->
            <div class="center-y px-2 py-2 selection-disabled bg-1 white--text">
                <v-icon
                    color="white"
                    size="40"
                >mdi-pound</v-icon>
                <v-card-title class="ml-1 pa-0 flex-grow-1">Channel</v-card-title>
            </div>

            <!-- Content -->
            <v-card-text class="pl-3 pr-2 pt-2 pb-0">
                <v-text-field
                    v-model="channel"
                    single-line
                    dense
                    placeholder="Channel name"
                    style="min-width: 100%;"
                    color="color-2"
                ></v-text-field>
                <v-checkbox
                    v-model="isPrivate"
                    color="color-2"
                    label="Private channel"
                    class="mt-0"
                ></v-checkbox>

                <div
                    class="selection-disabled"
                    v-text="`Members (${selectedUsers.length})`"
                ></div>
                <v-text-field
                    v-model="searchStr"
                    single-line
                    dense
                    hide-details
                    clearable
                    placeholder="Finding your friend"
                    style="min-width: 100%;"
                    color="color-2"
                ></v-text-field>

                <!-- Loading -->
                <v-progress-linear
                    :active="true"
                    :indeterminate="true"
                    class="mt-1"
                    :color="loading ? 'color-2' : 'transparent'"
                ></v-progress-linear>

                <!-- User list -->
                <v-sheet
                    class="transparent overflow-y-auto no-border-radius"
                    height="200"
                    max-height="200"
                >
                    <v-list-item-group>
                        <template v-for="wraper in users">
                            <v-list-item
                                :key="wraper.value.id"
                                v-if="!wraper.value._isMe"
                                @click="onSelectUser(wraper)"
                            >
                                <template v-slot:default>
                                    <v-list-item-action class="mr-3">
                                        <v-icon
                                            v-text="wraper.selected == true ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline'"
                                            :color="wraper.selected == true ? 'color-2' : ''"
                                        ></v-icon>
                                    </v-list-item-action>

                                    <v-list-item-content>
                                        <v-list-item-title v-text="wraper.value.fullName"></v-list-item-title>
                                    </v-list-item-content>

                                    <v-list-item-avatar v-if="wraper.value.avatarUrl">
                                        <v-img :src="wraper.value.avatarUrl"></v-img>
                                    </v-list-item-avatar>
                                </template>
                            </v-list-item>
                        </template>
                    </v-list-item-group>
                </v-sheet>
            </v-card-text>

            <!-- Actions -->
            <v-card-actions class="">
                <v-spacer></v-spacer>
                <v-btn
                    text
                    @click="onClose"
                >Cancel</v-btn>
                <v-btn
                    color="color-2"
                    text
                    @click="onSubmit"
                >Add</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import { mapState } from "vuex";
export default {
    props: {
        display: {
            type: Boolean,
            default: false,
        },
        value: {
            type: Object,
            default: () => ({}),
        },
    },
    data() {
        return {
            loading: false,
            channel: "",
            searchStr: "",
            isPrivate: true,
            users: [],
            selectedUsers: [],
        };
    },
    computed: {
        ...mapState({
            cachedUsers: state => state.users.all,
        }),
    },
    watch: {
        searchStr() {
            this.searchLocker.then(this.search);
        },
        display(value) {
            if (value) {
                if (!this.value.name) {
                    this.searchStr = "";
                    this.channel = "";
                    this.selectedUsers = [];
                } else {
                    this.channel = this.value.name;
                    this.isPrivate = this.value.private;
                    this.selectedUsers = this.value.subscribers.map(i => i.id);
                }
                this.setUserList(this.cachedUsers);
            }
        },
    },
    created() {
        this.searchLocker = Promise.resolve();
        this.setUserList(this.cachedUsers);
    },
    methods: {
        onClose() {
            this.$emit("close");
        },
        onSubmit() {
            if (this.channel && this.selectedUsers.length > 0) {
                const data = {
                    channel: true,
                    private: this.isPrivate,
                    name: this.channel,
                    subscribers: this.selectedUsers,
                };
                this.$emit("submit", data);
            }
        },
        onSelectUser(wrapper) {
            wrapper.selected = !wrapper.selected;
            if (wrapper.selected == true) {
                this.selectedUsers.push(wrapper.value.id);
            } else {
                const index = this.selectedUsers.indexOf(wrapper.value.id);
                index >= 0 && this.selectedUsers.splice(index, 1);
            }
        },
        setUserList(userList) {
            this.users = userList.map(user => {
                const wrapper = { value: user };
                wrapper.selected = this.selectedUsers.includes(user.id);
                return wrapper;
            });
        },
        search() {
            if (!this.searchStr) {
                this.searchLocker = Promise.resolve();
                this.setUserList(this.cachedUsers);
                return;
            }

            // Delay loading
            const timmer = setTimeout(() => {
                this.loading = true;
            }, 2 * 1000);

            // Request searching
            this.searchLocker = this.$store
                .dispatch("users/findUser", this.searchStr)
                .then(users => {
                    this.setUserList(users);
                })
                .catch(console.error)
                .finally(() => {
                    clearTimeout(timmer);
                    this.loading = false;
                    this.searchLocker = Promise.resolve();
                });
        },
    },
};
</script>
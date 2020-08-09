<template>
    <div class="search-message-panel app-content pa-0 fill-height d-flex flex-column border border-yl">
        <v-sheet
            height="57"
            class="pa-0 center-y no-border-radius px-3"
        >
            <!-- Search -->
            <v-text-field
                v-model="searchText"
                prepend-inner-icon="mdi-magnify"
                label="Search"
                name="search-message"
                flat
                solo
                hide-details
                clearable
                clear-icon="mdi-close"
                color="color-2"
                class="search-box"
                @keyup.esc="searchText = ''"
                @keyup.enter="onSearch"
            ></v-text-field>
        </v-sheet>
        <v-divider></v-divider>

        <div class="filter-panel pa-0 ma-0 center-y justify-sm-space-between">
            <v-subheader class="pl-3 pr-2 selection-disabled">Filters</v-subheader>
            <div class="spacer"></div>

            <!-- Add btn -->
            <v-btn
                icon
                fab
                class="ml-1 mr-3"
                rounded
                height="26"
                width="26"
            >
                <v-icon :size="20">mdi-plus</v-icon>
            </v-btn>
        </div>
        <v-divider></v-divider>

        <v-progress-linear
            :active="loading"
            :indeterminate="true"
        ></v-progress-linear>

        <!-- Messages -->
        <v-list class="search-message-list py-0 px-0">
            <div class="search-message-content overflow-y-auto">
                <!-- <template v-for="msg in messages">
                    <PinnedMessage :key="msg.id" class="px-4" :message="msg">
                    </PinnedMessage>
                </template> -->
            </div>
        </v-list>
    </div>
</template>

<script>
import { fillHeight } from "../../utils/layout.js";
import UserAvatar from "../../components/avatar/user-avatar.vue";
export default {
    props: {},
    components: { UserAvatar },
    data() {
        return {
            loading: false,
            searchText: null,
            messageList: [],
            selectedMsg: null,
        };
    },
    watch: {
    },
    created() {
        this.searchLocker = Promise.resolve();
    },
    mounted() {
        fillHeight("search-messages-list", 0, this.$el);
    },
    methods: {
        onSelect(msg) {
            this.selectedMsg = msg;
        },
        onSearch() {
            this.searchLocker.then(this.search);
        },
        search() {
            if (!this.searchText) {
                this.searchLocker = Promise.resolve();
                this.messageList = [];
                return;
            }

            // Request searching
            this.searchLocker = new Promise(resolve => {
                // Call search API
                resolve([]);
            }).then(list => {
                this.messageList = list;
            });
        },
    },
};
</script>

<style>
.search-message-panel {
    max-width: 20vw; 
    box-sizing: border-box;
}

.search-message-panel .filter-panel {
    min-width: 20vw;
    box-sizing: border-box;
}

/* .search-message-list  {
    height: 100%;
    max-height: 100%;
} */
</style>
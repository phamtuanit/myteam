<template>
    <div
        class="search-message-panel app-content pa-0 fill-height d-flex flex-column border border-yl"
    >
        <v-sheet height="57" class="pa-0 center-y no-border-radius px-3">
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
                @keyup.esc="onDiscardSearch"
                @keyup.enter="onSearch"
            ></v-text-field>
        </v-sheet>
        <v-divider></v-divider>

        <div class="filter-panel pa-0 ma-0 center-y justify-sm-space-between">
            <v-subheader class="pl-3 pr-2 selection-disabled"
                >Filters</v-subheader
            >
            <div class="spacer"></div>
            <!-- filter -->
            <v-menu
                :close-on-content-click="false"
                v-model="displayFilterDialog"
            >
                <template v-slot:activator="{ on }">
                    <v-btn icon small v-on="on" class="mr-2" title="Filters">
                        <v-icon small>mdi-filter-outline</v-icon>
                    </v-btn>
                </template>

                <v-card class="py-0 no-box-shadow" elevation="0">
                    <v-card-text class="pa-0">
                        <v-date-picker
                            locale="en-US"
                            v-model="dateRange"
                            no-title
                            range
                            class="mt-1"
                            first-day-of-week="1"
                        ></v-date-picker>
                        <!-- Type -->
                        <v-checkbox v-model="filterPhrase" color="orange darken-1" label="Strict phrase" class="ml-4 my-1"></v-checkbox>
                    </v-card-text>

                    <v-divider></v-divider>
                    <!-- Action -->
                    <v-card-actions class="py-1 px-2">
                        <v-spacer></v-spacer>
                        <v-btn color="primary mr-2" text @click="onClearFilter"
                            >Clear</v-btn
                        >
                        <v-btn color="primary" text @click="onFilter">OK</v-btn>
                    </v-card-actions>
                </v-card>
            </v-menu>

            <!-- Close search -->
            <v-btn
                icon
                small
                class="mr-2"
                @click="onClose"
                title="Close search"
            >
                <v-icon small>mdi-close-box</v-icon>
            </v-btn>
        </div>
        <v-divider></v-divider>
        <!-- Loading -->
        <v-progress-linear
            :active="isLoading"
            :indeterminate="true"
        ></v-progress-linear>

        <!-- Messages -->
        <v-list class="search-message-list py-0 px-0">
            <div class="search-message-content overflow-y-auto">
                <template v-for="(msg, index) in messageList">
                    <MessageItem :key="msg.id" class="px-4" :message="msg" @quote="onQuote" @copy="onCopy">
                        <template v-if="index > 0" v-slot:before>
                            <v-divider class="separator"></v-divider>
                        </template>
                    </MessageItem>
                </template>
                <div class="loading-element" v-intersect="{ handler: onLoadingElIntersect, options: { rootMargin: '200px 0px 200px 0px'}}"></div>
            </div>
        </v-list>
    </div>
</template>

<script>
import { mapState } from "vuex";
import { fillHeight } from "../../utils/layout.js";
import MessageItem from "./search-message-item.vue";
import UserAvatar from "../../components/avatar/user-avatar.vue";
const searchSvr = new (require("../../services/message-search.service.js").default)();
const SEARCH_TEMPLATE = {
    size: 20,
    sort: [{ _score: { order: "desc" } }, { created: { order: "asc" } }],
    highlight: {
        fields: {
            "body.html": {},
            "body.text": {},
        },
    },
    query: {
        bool: {
            must: [
                { range: { created: {} } },
                {
                    multi_match: {
                        query: "OK",
                        fields: ["body.html", "body.text"],
                        type: "phrase",
                    },
                },
            ],
        },
    },
};
export default {
    props: {},
    components: { UserAvatar, MessageItem },
    data() {
        return {
            isLoading: false,
            searchText: null,
            messageList: [],
            selectedMsg: null,
            searchResult: undefined,
            isReachedEnd: true,
            dateRange: [],
            filterPhrase: false,
            displayFilterDialog: false,
            hasScrollBar: false,
        };
    },
    computed: {
        ...mapState({
            allConv: state => state.conversations.channel.all,
            activatedConv: state => state.conversations.channel.active,
        }),
        dateRangeText() {
            return this.dateRange.join(" ~ ");
        },
    },
    created() {
        this.searchLocker = Promise.resolve();
        this.filters = {
            conversation: 0,
            criterials: SEARCH_TEMPLATE
        };
        const mustQr = this.filters.criterials.query.bool.must;
        this.filterDateRange = mustQr[0].range;
        this.filterMatch = mustQr[1]["multi_match"];
    },
    mounted() {
        fillHeight("search-message-content", 4, this.$el);
    },
    methods: {
        onSelect(msg) {
            this.selectedMsg = msg;
        },
        onDiscardSearch() {
            if (!this.searchText) {
                this.$emit("close");
                return;
            }
            this.searchText = "";
        },
        onClearFilter() {
            this.dateRange = [];
            this.filterPhrase = false;
        },
        onFilter() {
            this.displayFilterDialog = false;

            // Update date
            delete this.filterDateRange.created.gte;
            delete this.filterDateRange.created.lte;
            if (this.dateRange.length > 0) {
                let [before, after] = this.dateRange;
                this.filterDateRange.created.gte = before;

                if (after) {
                    this.filterDateRange.created.lte = after;
                }
            }

            // Filter type
            this.filterMatch.type = this.filterPhrase ? "phrase" : "best_fields";

            this.searchLocker.finally(this.search);
        },
        onSearch() {
            this.searchLocker.finally(this.search);
        },
        onClose() {
            this.$emit("close");
        },
        onQuote(message) {
            const rawMsg = {...message};
            rawMsg.body.content = rawMsg.body.html;
            rawMsg.from = { issuer: message.issuer, };
            this.$emit("quote", rawMsg);
        },
        onCopy(message) {
            const rawMsg = {...message};
            rawMsg.body.content = rawMsg.body.html;
            rawMsg.from = { issuer: message.issuer, };
            this.$emit("copy", rawMsg);
        },
        search() {
            if (!this.searchText) {
                this.searchLocker = Promise.resolve();
                this.messageList = [];
                this.updateSearchState();
                return;
            }

            // Build conversation id
            let convId;
            if (this.activatedConv && this.activatedConv.id) {
                convId = this.activatedConv.id;
            } else if (this.allConv.length > 0) {
                convId = this.allConv[0].id;
            }

            // Request searching
            this.filters.conversation = convId;
            this.filterMatch.query = this.searchText;
            this.filters.criterials.from = 0;
            this.isLoading = true;
            this.updateSearchState();
            this.searchLocker = searchSvr
                .search(this.filters)
                .finally(() => {
                    this.isLoading = false;
                    this.messageList = [];
                })
                .then(res => {
                    this.messageList = res.data.results;
                    this.updateSearchState(res.data);
                    this.confirmContent();
                });
        },
        onLoadingElIntersect([evt]) {
            this.hasScrollBar = evt.isIntersecting;
            if (evt.isIntersecting == true && this.isReachedEnd == false) {
                this.searchLocker.finally(this.loadMore);
            }
        },
        loadMore() {
            if (this.isReachedEnd) {
                return;
            }

            this.filters.criterials.from = this.messageList.length;
            this.isLoading = true;
            this.searchLocker = searchSvr
                .search(this.filters)
                .finally(() => {
                    this.isLoading = false;
                })
                .then(res => {
                    // Append result
                    this.messageList.splice(this.messageList.length - 1, 0, ...res.data.results);
                    this.updateSearchState(res.data);
                    this.confirmContent();
                });
        },
        confirmContent() {
            // If current data is short, need to load more
            this.$nextTick(() => {
                if (!this.hasScrollBar) {
                    this.searchLocker.finally(this.loadMore);
                }
            });
        },
        updateSearchState(res) {
            if (res) {
                this.searchResult = res;
                this.isReachedEnd =
                    !this.searchText ||
                    !this.searchResult ||
                    this.messageList.length === this.searchResult.total.value;
            } else {
                this.searchResult = null;
                this.isReachedEnd = true;
            }
        },
    },
};
</script>

<style>
.search-message-panel {
    max-width: 25vw;
    box-sizing: border-box;
}

.search-message-panel .filter-panel {
    min-width: 25vw;
    box-sizing: border-box;
}

 .search-message-panel .search-message-content .separator {
     margin-left: 40px;
 }

.search-message-panel .loading-element {
    height: 2px;
    width: 100%;
    background-color: transparent;
}
</style>

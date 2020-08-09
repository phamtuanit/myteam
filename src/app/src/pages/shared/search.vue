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
                @keyup.esc="onDiscardSearch"
                @keyup.enter="onSearch"
            ></v-text-field>
        </v-sheet>
        <v-divider></v-divider>

        <div class="filter-panel pa-0 ma-0 center-y justify-sm-space-between">
            <v-subheader class="pl-3 pr-2 selection-disabled">Filters</v-subheader>
            <div class="spacer"></div>
        </div>
        <v-divider></v-divider>

        <v-progress-linear
            :active="loading"
            :indeterminate="true"
        ></v-progress-linear>

        <!-- Messages -->
        <v-list class="search-message-list py-0 px-0">
            <div class="search-message-content overflow-y-auto">
                <template v-for="msg in messageList">
                    <MessageItem :key="msg.id" class="px-4" :message="msg">
                    </MessageItem>
                </template>
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
export default {
    props: {},
    components: { UserAvatar, MessageItem },
    data() {
        return {
            loading: false,
            searchText: null,
            messageList: [],
            selectedMsg: null,
            searchResult: undefined,
            isReachedEnd: true,
        };
    },
    computed: {
        ...mapState({
            allConv: state => state.conversations.channel.all,
            activatedConv: state => state.conversations.channel.active,
        }),
    },
    watch: {
    },
    created() {
        this.searchLocker = Promise.resolve();
        this.filters = {
            conversation: 0,
            criterials: {
                size: 10,
                sort : [{
                        created : {
                            order : "asc"
                        }
                }],
                query: {
                    text: "",
                }
            }
        };
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
            this.searchText = '';
        },
        onSearch() {
            this.searchLocker.finally(this.search);
        },
        search() {
            if (!this.searchText) {
                this.searchLocker = Promise.resolve();
                this.messageList = [];
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
            this.filters.criterials.query.text = this.searchText;
            this.searchLocker = searchSvr.search(this.filters)
            .then(res => {
                this.updateSearchState(res.data);
                return res.data;
            })
            .then(data => {
                this.messageList = data.results;
            })
        },
        updateSearchState(res) {
            this.searchResult = res;
            this.isReachedEnd = !this.searchText || !this.searchResult || this.messageList.length === this.searchResult.total.value;
        }
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
</style>
<template>
    <div class="infinity-scroll-container">
        <!-- Loading -->
        <v-progress-linear
            :active="isLoading"
            :indeterminate="true"
            class="progress-bar"
        ></v-progress-linear>

        <!-- Load more detector -->
        <div class="loading-detector" v-intersect="onReachingTopIntersect"></div>
    </div>
</template>

<script>
import { scrollToBottom } from "../utils/layout.js";
export default {
    props: {
        load: {
            type: Function,
            default: null,
        },
    },
    data() {
        return {
            isLoading: false,
            isReachedAllData: false,
            isReachedTop: false,
            hasLoaded:false,
        };
    },
    created() {
        this.locker = Promise.resolve();
    },
    mounted() {
        this.parent = this.$parent;
    },
    methods: {
        loadMore() {
            this.isLoading = true;
            // List of message element
            const containerEl = this.parent.$el;
            // To keep scroll position after scrolling
            const scrollHeight = containerEl.scrollHeight;

            // Load more content
            this.locker = this.load();
            this.locker.then(([list]) => {
                // Append result
                this.isReachedAllData = !list || list.length == 0;
                if (!this.isReachedAllData) {
                    // If current data is not enought, need to load more
                    setTimeout(() => {
                        if (this.isReachedTop) {
                            this.locker.finally(this.loadMore);
                        }
                    }, 300);
                }

                if (this.hasLoaded) {
                    // Incase user scrolled up
                    containerEl.scrollTop = -4 + containerEl.scrollHeight - scrollHeight;
                } else {
                    // Incase auto load to fill out viewable erea
                    scrollToBottom(containerEl);
                }
            }).finally(() => {
                this.isLoading = false;
            })
        },
        onReachingTopIntersect([evt]) {
            this.isReachedTop = evt.isIntersecting;
            // Field 'hasLoaded' will be changed only one times after finishing the first load (or incase fill out viewable erea)
            if (!this.hasLoaded) {
                this.hasLoaded = !this.isReachedTop || this.isReachedAllData;
            }

            // If user reached to top
            if (evt.isIntersecting == true && this.isReachedAllData == false) {
                this.locker.finally(this.loadMore);
            }
        },
    },
};
</script>

<style lang="scss">
.infinity-scroll-container {
    .loading-detector {
        height: 2px;
        width: 100%;
        background-color: transparent;
    }
}
</style>

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
        };
    },
    created() {
        this.locker = Promise.resolve();
    },
    mounted() {
        this.parent = this.$parent;
    },
    destroyed() {
    },
    methods: {
        loadMore() {
            this.isLoading = true;
            // List of message element
            const containerEl = this.parent.$el;
            // To keep scroll position after scrolling
            const scrollHeight = containerEl.scrollHeight;

            // Load more content
            const result = this.load();
            if (typeof result.then == "function") {
                // Result is a promise
                this.locker = result;
            } else {
                this.locker = Promise.resolve(result);
            }

            this.locker.then(([list]) => {
                // Append result
                console.log(list);
                this.isReachedAllData = !list || list.length == 0;
                // If current data is not enought, need to load more
                setTimeout(() => {
                    if (this.isReachedTop && !this.isReachedAllData) {
                        this.locker.finally(this.loadMore);
                    } else {
                        // Incase loading continuously, scroll to botom
                        scrollToBottom(containerEl);
                    }
                }, 1000);
                
                // Update scroll position
                if (this.isReachedTop) {
                    // Incase user is still at bottom
                    const currContentHeight = containerEl.lastElementChild.getBoundingClientRect().top - containerEl.firstElementChild.getBoundingClientRect().top;
                    containerEl.scrollTop = currContentHeight
                } else {
                    // Incase user already scrolled to top
                    containerEl.scrollTop = -4 + containerEl.scrollHeight - scrollHeight;
                }
            }).finally(() => {
                this.isLoading = false;
            })
        },
        onReachingTopIntersect([evt]) {
            this.isReachedTop = evt.isIntersecting;
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

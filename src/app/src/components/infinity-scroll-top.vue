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
            this.scrollHeight = containerEl.scrollHeight;

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
                setTimeout(() => {
                    // If current data is not enought, need to load more
                    if (this.isReachedTop && !this.isReachedAllData) {
                        containerEl.scrollTop = containerEl.scrollHeight;
                        this.locker.finally(this.loadMore);
                    }
                }, 1000);
            }).finally(() => {
                this.isLoading = false;
                containerEl.scrollTop = -4 + containerEl.scrollHeight - this.scrollHeight;
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

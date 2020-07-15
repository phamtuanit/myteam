<template>
    <div class="infinity-scroll-container">
        <div
            class="infinity-scroll infinity-scroll--top d-flex justify-center"
            v-bind="$attrs"
        >
            <div
                v-show="isLoading & scrollBar"
                class="spinner lds-dual-ring my-2"
            ></div>
            <v-btn
                icon
                rounded
                class="my-2"
                color="orange darken-1"
                :loading="isLoading"
                v-if="!scrollBar"
                title="Load more"
                @click="onLoadMore"
            >
                <v-icon>mdi-reload</v-icon>
            </v-btn>
        </div>
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
            isBusy: false,
            scrollBar: true,
        };
    },
    mounted() {
        this.parent = this.$parent;

        setTimeout(() => {
            if (this._isDestroyed || this._isBeingDestroyed) {
                return;
            }
            this.scrollBar = this.hasScrollBar();
            this.setupObserver();
        }, 500);
    },
    destroyed() {
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = undefined;
        }
        this.parent.$el.removeEventListener("scroll", this.onScroll);
    },
    methods: {
        onLoadMore() {
            if (this.isBusy == true || typeof this.load != "function") {
                return;
            }

            const containerEl = this.parent.$el;
            // To keep scroll position after scrolling
            this.scrollHeight = containerEl.scrollHeight;
            const currContentHeight =
                containerEl.lastElementChild.getBoundingClientRect().top -
                containerEl.firstElementChild.getBoundingClientRect().top;

            this.isBusy = true;
            this.isLoading = true;

            // Load more content
            const result = this.load();

            const finishLoading = function finish() {
                setTimeout(() => {
                    this.isBusy = false;
                }, 1000);
                // Simulate loading incase API runs fast
                this.isLoading = false;
                this.scrollBar = this.hasScrollBar();

                if (this.scrollBar) {
                    containerEl.scrollTop =
                        -4 + containerEl.scrollHeight - this.scrollHeight;
                } else {
                    containerEl.scrollTop =
                        containerEl.scrollHeight - currContentHeight;
                }
            }.bind(this);

            if (typeof result.then == "function") {
                // Result is a promise
                result.finally(finishLoading);
            } else {
                finishLoading();
            }
        },
        hasScrollBar() {
            const containerEl = this.parent.$el;
            return containerEl.scrollHeight > containerEl.clientHeight;
        },
        setupObserver() {
            // Watch scroll
            this.parent.$el.addEventListener("scroll", this.onScroll);

            // Watch inner items
            this.mutationObserver = new MutationObserver(() => {
                if (!this.isBusy) {
                    this.scrollBar = this.hasScrollBar();
                }
            });

            this.mutationObserver.observe(this.parent.$el, {
                childList: true,
                subtree: true,
            });
        },
        checkScroll() {
            if (this.isBusy == true || this.isLoading == true) {
                return;
            }
            this.scrollBar = this.hasScrollBar();

            const containerEl = this.parent.$el;
            this.isLoading = containerEl.scrollTop == 0 && this.hasScrollBar();

            if (this.isLoading == true) {
                this.onLoadMore();
            }
        },
        onScroll() {
            setTimeout(this.checkScroll, 0);
        },
    },
};
</script>

<style>
.infinity-scroll-container {
    position: relative;
}

.infinity-scroll {
    position: absolute;
    z-index: 99;
}

.infinity-scroll--top {
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
}

.spinner {
    width: 24px;
    height: 24px;
}

.spinner.lds-dual-ring {
    display: inline-block;
}

.spinner.lds-dual-ring:after {
    content: " ";
    display: block;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 3px solid var(--primary-color);
    border-color: var(--primary-color) transparent var(--primary-color)
        transparent;
    animation: lds-dual-ring 1.2s linear infinite;
}

@keyframes lds-dual-ring {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
</style>

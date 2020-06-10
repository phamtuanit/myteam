<template>
    <v-menu
        top
        offset-y
        v-model="show"
        :eager="true"
        internal-activator
        :id="id"
        content-class="giphy-popup-content"
        transition="scroll-y-transition"
        :close-on-content-click="false"
    >
        <template v-slot:activator="{ on }">
            <v-btn icon v-on="on" title="Gifs">
                <v-icon :size="size">mdi-sticker-emoji</v-icon>
            </v-btn>
        </template>
        <div>
            <v-text-field
                v-model="search"
                name="search-gif"
                class="mt-0 mb-2"
                placeholder="Search gif"
                hide-details
            ></v-text-field>
            <div :id="contentId" class="gifs-content"></div>
        </div>
    </v-menu>
</template>

<script>
import { GiphyFetch } from "@giphy/js-fetch-api";
import { renderGrid } from "@giphy/js-components";
import { debounce } from "../../utils/function.js";
import config from "../../conf/system.json";

const gf = new GiphyFetch(config.giphy.key);
export default {
    props: {
        value: {
            type: String,
            default: "",
        },
        size: {
            type: [String, Number],
            default: "24",
        },
        width: {
            type: Number,
            default: 300,
        },
        height: {
            type: Number,
            default: 400,
        },
    },
    data() {
        const id = new Date().getTime();
        return {
            show: false,
            search: "",
            contentId: "gifs-content-" + id,
            id: "giphy-" + id,
        };
    },
    watch: {
        show(val) {
            if (val == true && this.search == "") {
                this.$nextTick(this.render);
            }
        },
        search() {
            if (this.show == true) {
                this.render();
            }
        },
    },
    mounted() {
        this.contentEl = document.getElementById(this.contentId);
        this.contentEl.style.width = this.width + "px";
        this.contentEl.style.height = this.height + "px";

        // Define fetch option
        const width = this.getWidth();
        this.giphyOpt = {
            width,
            fetchGifs: this.fetchGifsWithoutAttribution,
            columns: width < 500 ? 2 : 3,
            onGifClick: this.onGifClick,
            onGifRightClick: this.onGifRightClick,
        };
    },
    methods: {
        onGifClick(gif, e) {
            e.preventDefault();
            this.$emit("input", gif);
            this.$emit("select", gif);
            this.show = false;
        },
        onGifRightClick(gif, e) {
            e.preventDefault();
        },
        render() {
            if (this.renderTask) {
                // Remove old data
                this.renderTask();
            }

            // Debounce
            if (this.timmer) {
                clearTimeout(this.timmer);
            }

            setTimeout(() => {
                this.renderTask = renderGrid(this.giphyOpt, this.contentEl);
            }, 300);
        },
        getWidth() {
            return this.width;
        },
        fetchGifs(offset) {
            const limit = 10;
            const searchStr = this.search.trim();
            if (searchStr) {
                return gf.search(searchStr, { offset, limit });
            }

            // Trending
            return gf.trending(searchStr, { offset, limit });
        },
        fetchGifsWithoutAttribution(offset) {
            return this.fetchGifs(offset).then(res => {
                if (res.data && Array.isArray(res.data)) {
                    res.data.forEach(gif => {
                        delete gif.user;
                        delete gif.username;
                    });
                }
                return res;
            });
        },
    },
};
</script>

<style scoped>
.giphy-popup-content {
    padding: 0 6px 6px 6px;
    background: #ffffff;
}

.gifs-content {
    overflow-y: auto;
    overflow-x: hidden;
}

.theme--dark.giphy-popup-content {
    background: #1E1E1E;
}

.giphy-popup-content img.giphy-gif-img + div {
    display: none;
}
</style>

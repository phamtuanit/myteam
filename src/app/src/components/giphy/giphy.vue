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
    >
        <template v-slot:activator="{ on }">
            <v-btn
                icon
                v-on="on"
                title="Ctrl+Shift+G"
            >
                <v-icon :size="size">mdi-sticker-emoji</v-icon>
            </v-btn>
        </template>
        <div :id="contentId">

        </div>
    </v-menu>
</template>

<script>
import { throttle } from "throttle-debounce";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { renderGrid } from "@giphy/js-components";
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
            contentId: "giphy-content-" + id,
            id: "giphy-" + id,
        };
    },
    watch: {
        show(val) {
            if (val) {
                this.$nextTick(this.render);
            } else {
                this.search = "";
            }
        },
    },
    mounted() {
        this.contentEl = document.getElementById(this.contentId);
        this.contentEl.style.width = this.width + "px";
        this.contentEl.style.height = this.height + "px";

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
        },
        onGifRightClick(gif, e) {
            e.preventDefault();
        },
        render() {
            renderGrid(this.giphyOpt, this.contentEl);
        },
        getWidth() {
            return this.width;
        },
        fetchGifs(offset) {
            const limit = 10;
            if (this.search) {
                return gf.search(this.search, { offset, limit });
            }

            // Trending
            return gf.trending(this.search, { offset, limit });
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
    padding: 4px;
    border-width: 4px;
    border-top: 4px;
    border-bottom: 4px;
    border-style: solid;
    border-color: #ffffff;
    background: #ffffff;
}

.giphy-popup-content img.giphy-gif-img + div {
    display: none;
}

.theme--dark .giphy-popup-content {
    border-color: #1e1e1e;
    background: #1e1e1e;
}
</style>
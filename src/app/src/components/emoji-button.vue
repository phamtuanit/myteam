<template>
    <v-menu
        top
        offset-y
        v-model="showEmojiPicker"
        :eager="true"
        internal-activator
        transition="scroll-y-transition"
        :close-on-content-click="false"
    >
        <template v-slot:activator="{ on }">
            <v-btn icon v-on="on" title="Ctrl+Shift+S">
                <v-icon :size="size">mdi-emoticon-happy-outline</v-icon>
            </v-btn>
        </template>

        <picker
            :data="emojiData"
            color="#043752"
            :showPreview="false"
            set="twitter"
            :infiniteScroll="true"
            @select="onSelectEmoji"
            @keyup.esc="showEmojiPicker = false"
        ></picker>
    </v-menu>
</template>

<script>
import { Picker, EmojiIndex } from "emoji-mart-vue-fast";
import emojiData from "emoji-mart-vue-fast/data/twitter.json";
import "emoji-mart-vue-fast/css/emoji-mart.css";
const emojiIndex = new EmojiIndex(emojiData, {
    exclude: ["flags", "symbols"],
});
export default {
    props: {
        size: {
            type: String,
            default: "24",
        },
        value: {
            type: Boolean,
            default: false,
        },
    },
    components: { Picker },
    data() {
        return {
            emojiData: emojiIndex,
            showEmojiPicker: false,
        };
    },
    watch: {
        showEmojiPicker(val) {
            this.$emit("input", val);
        },
        value(val) {
            this.showEmojiPicker = val;
        },
    },
    created() {
        this.showEmojiPicker = this.value;
    },
    mounted() {
        document.addEventListener("keyup", e => {
            // Hansle ESC  key
            if (e.keyCode === 27 && this.showEmojiPicker == true) {
                this.showEmojiPicker = false;
            }
        });
    },
    methods: {
        onSelectEmoji(emoji) {
            this.$emit("select", emoji);
        },
    },
};
</script>

<style lang="css">
.emoji-type-image.emoji-set-twitter {
    background-image: url("../assets/emoji/twitter-emoji-32.png");
}

.emoji-mart-category .emoji-mart-emoji > span {
    cursor: pointer;
}
</style>

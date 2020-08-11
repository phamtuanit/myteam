<template>
    <div class="conversation-notification" v-show="isDisplayed">
        <div
            class="notification_container--fixed pa-1 center-y"
            v-show="editing"
        >
            <v-chip color="orange darken-1" outlined @click="onScrollToOrigin">
                <v-icon>mdi-chevron-double-up</v-icon>
                <span class="ml-1">Editing message</span>
            </v-chip>
            <v-icon size="24" color="red" class="ml-1" @click="onCancelEdit"
                >mdi-close-circle</v-icon
            >
            <v-spacer></v-spacer>
        </div>
        <div class="notification_container--float d-flex">
            <v-spacer></v-spacer>
            <div v-show="allowScrollDown && !editing">
                <v-chip
                    class="ma-2"
                    color="orange darken-1"
                    outlined
                    @click="onReadMessage"
                >
                    <span class="ml-1">Jump to present</span>
                    <v-icon>mdi-chevron-double-down</v-icon>
                </v-chip>
            </div>
        </div>
    </div>
</template>

<script>
import { debounce } from "../../utils/function.js";
export default {
    props: {
        readMore: {
            type: Boolean,
            default: false,
        },
        editing: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            allowScrollDown: this.readMore,
        };
    },
    computed: {
        isDisplayed() {
            return this.editing || this.allowScrollDown;
        },
    },
    watch: {
        readMore(val) {
            if (!val) {
                this.allowScrollDown = val;
            } else {
                debounce(() => {
                    this.allowScrollDown = this.readMore;
                }, 1000)();
            }
        },
    },
    methods: {
        onReadMessage() {
            this.$emit("read-more");
        },
        onCancelEdit() {
            this.$emit("edit:cancel");
        },
        onScrollToOrigin() {
            this.$emit("edit:locate");
        },
    },
};
</script>

<style>
.conversation-notification {
    position: relative;
}

.conversation-notification .notification_container--float {
    position: absolute;
    height: 40px;
    top: -46px;
    left: 0;
    right: 0;
    z-index: 9;
}
</style>

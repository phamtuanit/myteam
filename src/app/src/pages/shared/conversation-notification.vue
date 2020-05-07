<template>
    <div class="conversation-notification">
        <div class="notification_container d-flex">
            <v-spacer></v-spacer>
            <div class="notification_content right d-flex">
                <v-chip
                    class="ma-2"
                    color="blue darken-1"
                    outlined
                    @click="onReadMessage"
                    v-show="allowScrollDown"
                >
                    <span class="ml-1">New message</span>
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
    },
    data() {
        return {
            allowScrollDown: false,
        };
    },
    watch: {
        readMore(val) {
            if (!val) {
                this.allowScrollDown = val;
            } else {
                debounce(() => {
                    this.allowScrollDown = this.readMore;
                }, 2 * 1000)();
            }
        },
    },
    methods: {
        onReadMessage() {
            this.$emit("read-more");
        },
    },
};
</script>

<style scoped>
.conversation-notification {
    position: relative;
    height: 0;
    background: green;
}

.notification_container {
    position: absolute;
    height: 40px;
    top: -46px;
    left: 0;
    right: 0;
}
</style>

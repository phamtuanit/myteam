<template>
    <v-badge
        :color="isOnline ? 'success' : 'pink'"
        dot
        light
        bottom
        overlap
        bordered
    >
        <Avatar
            :user-name="user.fullName || user.name || user.userName || user.id"
            :src="user.avatar"
            :size="size"
            :animation="animation"
        ></Avatar>
    </v-badge>
</template>

<script>
import Avatar from "./avatar";
export default {
    props: {
        user: Object,
        onlineEffect: Boolean,
        infinity: Boolean,
        size: {
            type: Number,
            default: 30,
        },
    },
    components: { Avatar },
    data() {
        return {
            enableAnimation: this.infinity,
        };
    },
    watch: {
        isOnline(val) {
            if (
                this.onlineEffect == true &&
                this.infinity == false &&
                val == true
            ) {
                this.enableAnimation = true;
                setTimeout(() => {
                    this.enableAnimation = false;
                }, 5 * 1000);
            } else {
                this.enableAnimation = false;
            }
        },
        infinity(val) {
            if (!val) {
                this.enableAnimation = val;
            }
        },
    },
    computed: {
        isOnline() {
            return this.user.status == "on";
        },
        animation() {
            return this.infinity == true || this.enableAnimation;
        },
    },
};
</script>

<style>
</style>

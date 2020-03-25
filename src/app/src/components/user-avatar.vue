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
            :user-name="user.fullName"
            :src="user.avatar"
            :size="30"
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
    },
    components: { Avatar },
    data() {
        return {
            enableAnimation: this.infinity,
        };
    },
    watch: {
        isOnline(val) {
            if (this.onlineEffect == true && this.infinity == false && val == true) {
                this.enableAnimation = true;
                setTimeout(() => {
                    this.enableAnimation = false;
                }, 5 * 1000);
            } else {
                this.enableAnimation = false;
            }
        },
    },
    computed: {
        isOnline() {
            return this.user.status == "on";
        },
        animation() {
            return this.infinity == true || this.enableAnimation;
        }
    },
};
</script>

<style>
</style>

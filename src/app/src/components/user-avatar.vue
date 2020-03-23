<template>
    <v-badge
        :color="isOnline ? 'success' : 'pink'"
        dot
        light
        bottom
        overlap
        bordered
    >
        <Avatar :user-name="user.fullName" :src="user.avatar" :size="30" :animation="animation"></Avatar>
        <!-- <v-avatar size="30">
            <v-img src="https://randomuser.me/api/portraits/men/81.jpg"></v-img>
        </v-avatar> -->
    </v-badge>
</template>

<script>
import Avatar from "./avatar";
export default {
    props: {
        user: Object,
        animation: Boolean
    },
    components: { Avatar },
    computed: {
        isOnline() {
            return this.user.status == "on";
        },
    },
};
</script>

<style>
</style>

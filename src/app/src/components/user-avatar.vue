<template>
    <v-badge
        :color="isOnline ? 'success' : 'pink'"
        dot light
        bottom
        overlap
        bordered
    >
        <v-avatar size="30">
            <v-img src="https://randomuser.me/api/portraits/men/81.jpg"></v-img>
        </v-avatar>
    </v-badge>
</template>

<script>
export default {
    props: ["user"],
    computed: {
        isOnline() {
            return this.user.status == "on";
        },
    },
};
</script>

<style>
</style>

<template>
    <v-list-item class="px-2 my-message">
        <v-list-item-avatar></v-list-item-avatar>
        <v-spacer></v-spacer>
        <v-card flat class="mr-1 message--text py-1">
            <v-card-subtitle class="py-1" v-text="new Date().toLocaleString()">
            </v-card-subtitle>
            <v-card-text class="pt-0 pb-1 px-4" v-html="message.body.content">
            </v-card-text>
        </v-card>
    </v-list-item>
</template>

<script>
export default {
    props: ["index", "message"],
};
</script>

<style>
</style>

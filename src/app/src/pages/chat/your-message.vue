<template>
    <v-list-item class="px-2 your-message">
        <v-list-item-avatar class="ma-0">
            <v-avatar size="30" class="mx-auto">
                <v-img
                    :src="
                        `https://randomuser.me/api/portraits/men/${index}.jpg`
                    "
                ></v-img>
            </v-avatar>
        </v-list-item-avatar>
        <v-card flat class="ml-1 message--text py-1">
            <v-card-subtitle class="py-1" v-text="new Date().toLocaleString()">
            </v-card-subtitle>
            <v-card-text class="pt-0 pb-1 px-4" v-html="message.body.content">
            </v-card-text>
        </v-card>
        <v-spacer></v-spacer>
        <v-list-item-avatar></v-list-item-avatar>
    </v-list-item>
</template>

<script>
export default {
    props: ["index", "message"],
};
</script>

<style>
</style>
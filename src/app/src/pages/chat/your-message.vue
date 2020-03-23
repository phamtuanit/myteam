<template>
    <v-list-item class="px-2 message-item your-message" :data-msg-index="index">
        <v-list-item-avatar class="ma-0">
            <UserAvatar :user="user" />
        </v-list-item-avatar>
        <v-card flat class="ml-1 message--text py-1">
            <v-card-subtitle class="py-1" v-text="displayTime">
            </v-card-subtitle>
            <v-card-text class="pt-0 pb-1 px-4" v-html="message.body.content">
            </v-card-text>
        </v-card>
        <v-spacer></v-spacer>
        <v-list-item-avatar></v-list-item-avatar>
    </v-list-item>
</template>

<script>
import UserAvatar from "../../components/user-avatar.vue";
export default {
    props: ["index", "message", "user"],
    components: {UserAvatar},
    computed: {
        displayTime() {
            return new Date(this.message.arrivalTime).toLocaleString();
        }
    }
};
</script>

<style>
</style>

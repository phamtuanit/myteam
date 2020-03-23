<template>
    <v-list-item class="px-2 message-item your-message" :data-msg-index="index">
        <v-list-item-avatar class="ma-0">
            <UserAvatar :user="user" />
        </v-list-item-avatar>
        <v-card flat class="ml-1 message--text py-1">
            <div class="py-1 px-4">
                <span class="subtitle-2 mr-2" v-text="fullName"></span>
                <span class="caption" v-text="time"></span>
            </div>
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
        fullName() {
            const nameArr = [this.user.firstName, this.user.lastName]
            return this.user.fullName || nameArr.join(", ");
        },
        time() {
            return new Date(this.message.arrivalTime).toLocaleString();
        }
    }
};
</script>

<style>
</style>

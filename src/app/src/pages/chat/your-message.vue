<template>
    <v-list-item class="px-2 message-item your-message" :data-msg-index="index">
        <v-list-item-avatar class="ma-0">
            <UserAvatar :user="user" online-effect/>
        </v-list-item-avatar>
        <div class="ml-1 message-card-wrapper">
            <v-card flat class="message-card py-1">
                <div class="py-1 px-4 card-header">
                    <span class="subtitle-2 mr-2" v-text="fullName"></span>
                    <span class="caption" v-text="time"></span>
                    <v-spacer></v-spacer>
                    <v-icon small class="ml-2 like-icon">mdi-thumb-up</v-icon>
                </div>
                <v-card-text
                    class="pt-0 pb-1 px-4"
                    v-html="message.body.content"
                >
                </v-card-text>
            </v-card>
        </div>
        <v-spacer></v-spacer>
        <v-list-item-avatar></v-list-item-avatar>
    </v-list-item>
</template>

<script>
import UserAvatar from "../../components/user-avatar.vue";
export default {
    props: ["index", "message", "user"],
    components: { UserAvatar },
    computed: {
        fullName() {
            const nameArr = [this.user.firstName, this.user.lastName];
            return this.user.fullName || nameArr.join(", ");
        },
        time() {
            return new Date(this.message.arrivalTime).toLocaleString();
        },
    },
};
</script>

<style scoped>
.message-card-wrapper {
    position: relative;
}
.message-card {
    position: relative;
}

.card-header {
    position: relative;
    display: flex;
    align-items: center;
    -webkit-box-align: center;
    -webkit-box-flex: 1;
}

.v-icon.like-icon {
    position: relative;
    opacity: 0.4;
    color: #1565c0 !important;
    transition: all .2s ease-in-out;
}

.v-icon.like-icon:not(.active):hover {
    opacity: 1;
    cursor: pointer;
    transform: scale(1.1);
}

.v-icon.like-icon.active {
    opacity: 1;
}
</style>

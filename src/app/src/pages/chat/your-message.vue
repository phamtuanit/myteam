<template>
    <v-list-item class="px-2 message-item your-message" :data-msg-index="index">
        <v-list-item-avatar class="ma-0">
            <UserAvatar :user="user" online-effect />
        </v-list-item-avatar>
        <div class="ml-1 message-card-wrapper">
            <!-- Message -->
            <v-card flat class="message-card py-1">
                <div class="py-1 px-4 card-header">
                    <span class="subtitle-2 mr-2" v-text="fullName"></span>
                    <span class="caption" v-text="time"></span>
                    <v-spacer></v-spacer>

                    <!-- <v-menu transition="slide-x-transition" right>
                        <template v-slot:activator="{ on }">
                            <v-icon small class="ml-3" title="more" v-on="on"
                                >mdi-dots-vertical</v-icon
                            >
                        </template>
                        <v-card min-height="100" min-width="150" flat> </v-card>
                    </v-menu> -->

                    <!-- Action -->
                    <div class="message-actions-wrapper">
                        <v-spacer></v-spacer>
                        <v-card class="message-actions py-1 px-1" elevation="1">
                            <v-icon
                                size="18"
                                color="yellow darken-3"
                                class="ml-2"
                                title=":like:"
                                >mdi-thumb-up</v-icon
                            >
                            <v-icon
                                size="18"
                                color="red darken-3"
                                class="ml-2"
                                title=":heart:"
                                >mdi-heart</v-icon
                            >
                            <v-icon
                                size="18"
                                color="yellow darken-3"
                                class="ml-2"
                                title=":happy:"
                                >mdi-emoticon-excited</v-icon
                            >
                            <v-icon
                                size="18"
                                color="blue darken-1"
                                class="ml-2"
                                title=":cry:"
                                >mdi-emoticon-cry</v-icon
                            >
                            <v-icon
                                size="18"
                                color="yellow darken-3"
                                class="mx-2"
                                title=":angry:"
                                >mdi-emoticon-angry</v-icon
                            >
                        </v-card>
                    </div>
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

.message-actions .v-icon {
    cursor: pointer;
}

.message-actions-wrapper {
    visibility: hidden;
    position: absolute;
    display: flex;
    align-items: center;
    -webkit-box-align: center;
    -webkit-box-flex: 1;
    background: transparent;
    left: 0;
    right: -30px;
    top: -25px;
}

.message-actions {
    display: flex;
    -webkit-box-align: center;
    align-items: center;
    border-radius: 5px;
}

.message-actions.v-card {
    border-radius: 14px;
}

.card-header:hover .v-icon {
    opacity: 0.5;
}

.message-actions .v-icon:hover {
    transition: all 0.2s ease-in;
    opacity: 1;
    transform: scale(1.2);
}

.card-header:hover .message-actions-wrapper {
    visibility: visible;
    z-index: 99;
    right: -20px;
    transition: all 0.2s ease-in;
}
</style>

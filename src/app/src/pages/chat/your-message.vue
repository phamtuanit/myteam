<template>
    <v-list-item class="px-2 message-item your-message" :data-msg-index="index">
        <v-list-item-avatar class="ma-0">
            <UserAvatar :user="user" online-effect />
        </v-list-item-avatar>
        <!-- Message -->
        <v-card flat class="message-card py-1 ml-1" :disabled="!isAvailable">
            <div class="py-1 px-4 card-header">
                <span class="subtitle-2 mr-2" v-text="fullName"></span>
                <span class="caption" v-text="time"></span>
                <v-spacer></v-spacer>
                <v-icon
                    v-if="!isAvailable"
                    small
                    color="red lighten-1"
                    class="ml-2"
                    v-text="warnIcon"
                ></v-icon>

                <!-- Reactions -->
                <div class="message-reactions-wrapper" v-if="isAvailable">
                    <v-spacer></v-spacer>
                    <v-card class="message-reactions py-1 px-1" elevation="1">
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
            <v-card-text class="pt-0 pb-1 px-4" v-html="message.body.content">
            </v-card-text>
        </v-card>

        <!-- Actions -->
        <div class="message-actions ml-1" v-if="isAvailable">
            <v-btn icon small class="mx-auto">
                <v-icon small>mdi-reply</v-icon>
            </v-btn>
        </div>
        <v-spacer></v-spacer>
    </v-list-item>
</template>

<script>
import UserAvatar from "../../components/user-avatar.vue";
export default {
    props: ["index", "message", "user"],
    components: { UserAvatar },
    data() {
        return {
            messageStatus: null,
        };
    },
    computed: {
        fullName() {
            const nameArr = [this.user.firstName, this.user.lastName];
            return this.user.fullName || nameArr.join(", ");
        },
        time() {
            return new Date(this.message.arrivalTime).toLocaleString();
        },
        isAvailable() {
            return !this.message.status;
        },
        warnIcon() {
            if (this.isAvailable) {
                return "";
            }

            switch (this.messageStatus) {
                case "removed":
                    return "mdi-delete-variant";

                default:
                    break;
            }

            return "";
        },
    },
    watch: {
        message: {
            deep: true,
            handler(val) {
                this.messageStatus = val.status;
            },
        },
    },
    created() {
        if (!("status" in this.message)) {
            this.$set(this.message, "status", null);
        }
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

/* Card header */
.card-header {
    position: relative;
    display: flex;
    align-items: center;
    -webkit-box-align: center;
    -webkit-box-flex: 1;
}

/* Reactions */
.message-reactions .v-icon {
    cursor: pointer;
}

.message-reactions-wrapper {
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

.card-header:hover .message-reactions-wrapper {
    visibility: visible;
    z-index: 99;
    right: -20px;
    transition: all 0.2s ease-in;
}

.message-reactions {
    display: flex;
    -webkit-box-align: center;
    align-items: center;
    border-radius: 5px;
}

.message-reactions.v-card {
    border-radius: 14px;
}

.message-reactions:hover .v-icon {
    transition: all 0.2s ease-in;
    opacity: 0.5;
}

.message-reactions .v-icon:hover {
    transition: all 0.2s ease-in;
    opacity: 1;
    transform: scale(1.2);
}
</style>

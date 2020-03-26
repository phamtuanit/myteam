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
            </div>
            <v-card-text class="message-content py-0 px-4" v-html="message.body.content">
            </v-card-text>

            <!-- Reacted Emoji -->
            <ReactionEmoji
                :message="message"
                class="px-4 mt-1 reactions-emojis"
                @change="onClearReaction"
            ></ReactionEmoji>

            <!-- Reactions -->
            <Reaction @react="onReact" class="reactions-panel" :selected="reactedType"  v-if="isAvailable">
            </Reaction>
        </v-card>

        <!-- Actions -->
        <div class="message-actions ml-1" v-if="isAvailable">
            <v-btn icon small class="mx-auto" @click="onReply">
                <v-icon small>mdi-reply</v-icon>
            </v-btn>
        </div>
        <v-spacer></v-spacer>
    </v-list-item>
</template>

<script>
import UserAvatar from "../../components/user-avatar.vue";
import ReactionEmoji from "../../components/message-emoji.vue";
import Reaction from "../../components/message-reaction.vue";

import { mapState } from "vuex";
export default {
    props: ["index", "message", "user"],
    components: { UserAvatar, ReactionEmoji, Reaction },
    data() {
        return {
            messageStatus: null,
        };
    },
    computed: {
        ...mapState({
            me: state => state.users.me,
        }),
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
        reactedType() {
            if (!this.message || !this.message.reactions) {
                return "";
            }

            const lastReaction = this.message.reactions.find(r => r.user == this.me.id);
            return lastReaction ? lastReaction.type : "";
        }
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
    methods: {
        onReact(reaction) {
            this.$emit("react", reaction.type, this.message);
        },
        onClearReaction(type) {
            this.$emit("dereact", type, this.message);
        },
        onReply(){
            this.$emit("reply", this.message);
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
.message-item >>> .reactions-wrapper {
    visibility: hidden;
    position: absolute;
    left: 30px;
    bottom: -15px;
}

.message-item >>> .message-card:hover .reactions-wrapper {
    transition: all 0.2s ease-in;
    visibility: visible;
    z-index: 9;
    left: 10px;
}

.reactions-emojis:hover + .reactions-panel {
    transition: all 0.5s ease-out;
    opacity: 0;
}

</style>

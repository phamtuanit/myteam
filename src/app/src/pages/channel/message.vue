<template>
    <v-sheet class="channel-message-item d-flex transparent mx-4">
        <div class="message-item__user pr-1">
            <v-list-item-avatar class="ma-0">
                <UserAvatar :user="user" :online-effect="!user._isMe" />
            </v-list-item-avatar>
        </div>
        <!-- content -->
        <div class="message-item__content d-flex flex-column flex-grow-1">
            <!-- Message -->
            <v-card elevation="0" class="flex-grow-1 px-3 py-2">
                <div class="message-item__content-header center-y">
                    <!-- User info -->
                    <span class="subtitle-2 mr-2" v-text="user.fullName"></span>
                    <v-spacer></v-spacer>

                    <!-- Reacted Emoji -->
                    <ReactionEmoji
                        :message="message"
                        class="ml-2"
                        @change="onClearReaction"
                    ></ReactionEmoji>
                </div>
                <v-divider class="mt-1"></v-divider>
                <v-card-text
                    class="message-item__content-text pa-0 mt-2"
                    v-html="message.body.content"
                ></v-card-text>
            </v-card>
            <div class="message-item__content-footer d-flex">
                <v-spacer></v-spacer>

                <div class="custom-align">
                    <!-- Reactions -->
                    <Reaction @react="onReact" :selected="reactedType" />
                </div>
            </div>
        </div>

        <!-- Mark -->
        <div class="message-item__mark"></div>
    </v-sheet>
</template>

<script>
import UserAvatar from "../../components/user-avatar.vue";
import ReactionEmoji from "../../components/message-emoji.vue";
import Reaction from "../../components/message-reaction.vue";

import { mapState } from "vuex";
export default {
    components: { UserAvatar, ReactionEmoji, Reaction },
    props: {
        message: {
            type: Object,
        },
    },
    data() {
        return {
            user: {
                fullName: "Unknow",
            },
        };
    },
    computed: {
        ...mapState({
            me: (state) => state.users.me,
        }),
        reactedType() {
            if (!this.message || !this.message.reactions) {
                return "";
            }

            const lastReaction = this.message.reactions.find(
                (r) => r.user == this.me.id
            );
            return lastReaction ? lastReaction.type : "";
        },
    },
    created() {
        if (this.message.from.issuer) {
            this.$store
                .dispatch("users/resolve", this.message.from.issuer)
                .then((user) => {
                    this.user = user;
                })
                .catch(console.error);
        }
    },
    methods: {
        onReact(reaction) {
            this.$emit("react", reaction.type, this.message);
        },
        onClearReaction(type) {
            this.$emit("dereact", type, this.message);
        },
    },
};
</script>

<style scoped>
.message-item__mark {
    min-width: 40px;
}

.message-item__content-header {
    position: relative;
    min-height: 30px;
}

.theme--light .message-item__content .message-item__content-text {
    color: rgba(0, 0, 0, 0.8);
}

/* Reacted */
.reactions-emojis:hover + .reactions-panel {
    transition: all 0.5s ease-out;
    opacity: 0;
}

/* Reactions */
.message-item__content-footer >>> .reactions-panel {
    position: absolute;
    visibility: hidden;
    opacity: 0.3;
    bottom: 0;
    top: 0;
    right: 30px;
}

.message-item__content:hover >>> .reactions-panel {
    transition: all 0.2s ease-in;
    visibility: visible;
    opacity: 1;
    right: 16px;
}

.channel-message-item >>> .message-item__content-text > p:last-child {
    margin-bottom: 2px;
}
</style>

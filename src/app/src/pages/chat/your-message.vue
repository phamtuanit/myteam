<template>
    <v-list-item class="px-2 message-item your-message">
        <v-list-item-avatar class="my-0 ml-2 mr-0">
            <UserAvatar
                :user="user"
                online-effect
            />
        </v-list-item-avatar>

        <!-- Message -->
        <div class="message-item__content">
            <v-card
                flat
                class="message-item__content--card ml-1 py-2 px-3"
                :disabled="!isAvailable"
            >
                <!-- Header -->
                <div class="message-item__content-header selection-disabled">
                    <span
                        class="subtitle-2 mr-2 user-name"
                        v-text="fullName"
                    ></span>
                    <span
                        class="caption"
                        v-text="timeAgo"
                    ></span>
                    <v-spacer></v-spacer>
                    <v-icon
                        v-if="!isAvailable"
                        small
                        color="red lighten-1"
                        class="ml-2"
                        v-text="warnIcon"
                    ></v-icon>
                    <!-- Reacted Emoji -->
                    <ReactionEmoji
                        :message="message"
                        class="ml-2"
                        @change="onClearReaction"
                    ></ReactionEmoji>
                </div>

                <!-- Body -->
                <v-card-text
                    class="message-item__content-text pa-0 mt-1 hl"
                    v-html="message.body.content"
                >
                </v-card-text>
            </v-card>

            <div class="message-item__content-footer">
                <v-spacer></v-spacer>

                <div class="custom-align">
                    <!-- Reactions -->
                    <Reaction
                        @react="onReact"
                        :selected="reactedType"
                        v-if="isAvailable"
                    />
                </div>
            </div>
        </div>

        <!-- Actions -->
        <div
            class="message-item__actions ml-2"
            v-if="isAvailable"
        >
            <v-btn
                icon
                small
                class="mx-auto"
                @click="onReply"
            >
                <v-icon small>mdi-reply</v-icon>
            </v-btn>
        </div>
        <v-spacer></v-spacer>
        <div style="min-width: 40px;"></div>
    </v-list-item>
</template>

<script>
import UserAvatar from "../../components/user-avatar.vue";
import ReactionEmoji from "../../components/message-emoji.vue";
import Reaction from "../../components/message-reaction.vue";

import { mapState } from "vuex";
import mixin from "../../mixin/message.mix.js";
export default {
    mixins: [mixin],
    props: ["user"],
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

            const lastReaction = this.message.reactions.find(
                r => r.user == this.me.id
            );
            return lastReaction ? lastReaction.type : "";
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
    methods: {
        onReact(reaction) {
            this.$emit("react", reaction.type, this.message);
        },
        onClearReaction(type) {
            this.$emit("dereact", type, this.message);
        },
        onReply() {
            this.$emit("reply", this.message);
        },
    },
};
</script>

<style scoped>
.message-item__content-footer {
    position: relative;
    display: flex;
    align-items: center;
    -webkit-box-align: center;
    -webkit-box-flex: 1;
}

.custom-align {
    position: absolute;
    display: flex;
    align-items: center;
    -webkit-box-align: center;
    right: 0;
    top: -14px;
}

/* Card header */
.message-item__content-header {
    position: relative;
    display: flex;
    align-items: center;
    -webkit-box-align: center;
    -webkit-box-flex: 1;
}

.reactions-emojis:hover + .reactions-panel {
    transition: all 0.5s ease-out;
    opacity: 0;
}

/* Reactions */
.message-item__content-footer >>> .reactions-panel {
    position: absolute;
    visibility: hidden;
    bottom: 0;
    top: 0;
    right: -10px;
}

.message-item__content:hover >>> .reactions-panel {
    transition: all 0.2s ease-in;
    visibility: visible;
    right: -30px;
}
</style>

<template>
    <v-sheet
        class="channel-message-item d-flex transparent mx-4"
        :class="{
            'message-item--me': isMyMessage,
            'message-item--deleted': message.status == 'removed',
        }"
    >
        <div class="message-item__user pr-1">
            <v-list-item-avatar class="ma-0">
                <UserAvatar
                    :user="user"
                    :online-effect="!user._isMe"
                />
            </v-list-item-avatar>
        </div>
        <!-- content -->
        <div class="message-item__content d-flex flex-column flex-grow-1">
            <v-card
                elevation="0"
                class="flex-grow-1 message-item__content-card"
                :disabled="message.status == 'removed'"
            >
                <slot></slot>

                <!-- Header -->
                <div class="message-item__content-header center-y px-3 pt-2">
                    <!-- User info -->
                    <span
                        class="subtitle-2 mr-2"
                        v-text="user._isMe ? 'Yours' : user.fullName"
                    ></span>
                    <span
                        class="caption"
                        v-text="timeAgo"
                    ></span>
                    <v-spacer></v-spacer>

                    <!-- Reacted Emoji -->
                    <ReactionEmoji
                        :message="message"
                        class="ml-2"
                        @change="onClearReaction"
                    ></ReactionEmoji>

                    <!-- Actions -->
                    <div
                        class="message-item__content-actions center-y"
                        v-if="isMyMessage"
                    >
                        <v-menu left>
                            <template v-slot:activator="{ on }">
                                <v-btn
                                    icon
                                    small
                                    v-on="on"
                                    class="mx-auto"
                                >
                                    <v-icon small>mdi-dots-vertical</v-icon>
                                </v-btn>
                            </template>
                            <v-list class="menus">
                                <v-list-item @click="onDelete">
                                    <v-list-item-title>Delete</v-list-item-title>
                                </v-list-item>
                                <v-list-item @click="onEdit">
                                    <v-list-item-title>Edit</v-list-item-title>
                                </v-list-item>
                            </v-list>
                        </v-menu>
                    </div>
                </div>
                <!-- Content -->
                <v-card-text
                    class="message-item__content-text px-3 pt-0 pb-1 mt-1 hl"
                    v-html="message.body.content"
                ></v-card-text>
                <!-- Actions -->
                <div
                    class="message-item__content-footer d-flex"
                    v-if="message.status != 'removed'"
                >
                    <v-spacer></v-spacer>

                    <div class="custom-align">
                        <!-- Reactions -->
                        <Reaction
                            @react="onReact"
                            :selected="reactedType"
                        />
                    </div>
                </div>
            </v-card>
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
import mixin from "../../mixin/message.mix.js";
export default {
    components: { UserAvatar, ReactionEmoji, Reaction },
    mixins: [mixin],
    data() {
        return {
            user: {
                fullName: "Unknow",
            },
        };
    },
    computed: {
        ...mapState({
            me: state => state.users.me,
        }),
        reactedType() {
            if (!this.message || !this.message.reactions) {
                return "";
            }

            const lastReaction = this.message.reactions.find(
                r => r.user == this.me.id
            );
            return lastReaction ? lastReaction.type : "";
        },
        isMyMessage() {
            return this.me.id === this.message.from.issuer;
        },
    },
    created() {
        if (this.message.from.issuer) {
            this.$store
                .dispatch("users/resolve", this.message.from.issuer)
                .then(user => {
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
        onDelete() {
            this.$emit("delete", this.message);
        },
        onEdit() {
            this.$emit("edit", this.message);
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
    min-height: 24px;
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
.message-item__content-footer {
    position: relative;
    height: 8px;
}

.message-item__content-footer >>> .reactions-panel {
    position: absolute;
    visibility: hidden;
    opacity: 0.3;
    bottom: 10px;
    right: 30px;
}

.message-item__content:hover >>> .reactions-panel {
    transition: all 0.2s ease-in;
    visibility: visible;
    opacity: 1;
    right: 16px;
}

.channel-message-item >>> .message-item__content-text p:last-child {
    margin-bottom: 2px;
}

.message-item__content-card {
    position: relative;
}

.message-item--me .message-item__content-card::after {
    content: "";
    position: absolute;
    background-color: #1e88e5;
    width: 3px;
    right: 0px;
    bottom: 0;
    top: 0;
}

.message-item--deleted .message-item__content-card::after {
    background-color: red;
}

.message-item--deleted .message-item__content-actions {
    display: none;
}

.channel-message-item >>> .message-item__content-text blockquote {
    position: relative;
    overflow: hidden;
    padding-right: 1.5em;
    padding-left: 1.5em;
    margin-left: 0;
    margin-right: 0;
    font-style: italic;
    border-left: 4px solid #ccc;
}
</style>

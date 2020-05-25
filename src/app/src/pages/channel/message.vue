<template>
    <v-sheet
        class="message-item channel-message-item d-flex transparent mx-4"
        :id="'channel-message-' + message.id"
        :data-message-id="message.id"
        :class="{
            'message-item--me': isMyMessage,
            'message-item--deleted': message.status == 'removed',
            'message-item--editing': message.status == 'editing',
        }"
    >
        <div class="message-item__user pr-1">
            <v-list-item-avatar class="ma-0">
                <UserAvatar :user="user" :online-effect="!user._isMe" />
            </v-list-item-avatar>
        </div>
        <!-- content -->
        <div class="message-item__content d-flex flex-column flex-grow-1">
            <v-card
                elevation="0"
                class="flex-grow-1 message-item__content--card"
                :disabled="message.status == 'removed'"
            >
                <slot></slot>

                <!-- Header -->
                <div
                    class="message-item__content-header selection-disabled center-y px-3 pt-2"
                >
                    <!-- User info -->
                    <span
                        class="subtitle-2 user-name"
                        v-text="user._isMe ? 'Me' : user.fullName"
                    ></span>
                    <span class="caption" v-text="timeAgo"></span>
                    <v-spacer></v-spacer>

                    <!-- Reacted Emoji -->
                    <ReactionEmoji
                        :message="message"
                        class="ml-2"
                        @change="onClearReaction"
                    ></ReactionEmoji>

                    <!-- Actions -->
                    <div
                        class="message-item__content-actions center-y ml-1 mr-1"
                    >
                        <v-menu left>
                            <template v-slot:activator="{ on }">
                                <v-btn icon small v-on="on" class="mr-0">
                                    <v-icon small>mdi-dots-vertical</v-icon>
                                </v-btn>
                            </template>
                            <v-list class="menus" v-if="isMyMessage">
                                <v-list-item @click="onQuote">
                                    <v-list-item-title>Quote</v-list-item-title>
                                </v-list-item>
                                <v-list-item @click="onEdit">
                                    <v-list-item-title>Edit</v-list-item-title>
                                </v-list-item>
                                <v-list-item @click="onDelete">
                                    <v-list-item-title class="red--text"
                                        >Delete</v-list-item-title
                                    >
                                </v-list-item>
                            </v-list>
                            <v-list class="menus" v-else>
                                <v-list-item @click="onQuote">
                                    <v-list-item-title>Quote</v-list-item-title>
                                </v-list-item>
                            </v-list>
                        </v-menu>
                    </div>
                </div>
                <!-- Content -->
                <v-card-text
                    class="message-item__content-text px-3 pt-0 pb-0 mt-1 hl"
                    v-html="message.body.content"
                ></v-card-text>

                <!-- Actions -->
                <div class="message-item__content-footer d-flex mb-1">
                    <v-spacer></v-spacer>

                    <div v-if="message.status != 'removed'">
                        <!-- Reactions -->
                        <Reaction @react="onReact" :selected="reactedType" />
                    </div>
                </div>
            </v-card>
        </div>

        <!-- Mark -->
        <div class="message-item__mark">
            <div class="message-item__mark-container">
                <div
                    class="mark-item rounded orange darken-1"
                    icon
                    v-if="isMentionMe"
                >
                    <v-icon small color="white">mdi-at</v-icon>
                </div>
            </div>
        </div>
    </v-sheet>
</template>

<script>
import UserAvatar from "../../components/avatar/user-avatar.vue";
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
        isMentionMe() {
            if (
                this.isMyMessage ||
                !this.message.mentions ||
                this.message.mentions.length === 0
            ) {
                return false;
            }

            return (
                this.message.mentions.includes(this.me.id) ||
                this.message.mentions.includes("all-users")
            );
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
        onQuote() {
            this.$emit("quote", this.message);
        },
        onEdit() {
            this.$emit("edit", this.message);
        },
    },
};
</script>

<style scoped>
.message-item__mark {
    position: relative;
    min-width: 40px;
}

.message-item__content-header {
    position: relative;
    min-height: 36px;
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
    height: 4px;
}

.message-item__content-footer >>> .reactions-panel {
    position: absolute;
    visibility: hidden;
    opacity: 0.3;
    bottom: 16px;
    left: -40px;
}

.message-item__content:hover >>> .reactions-panel {
    transition: all 0.2s ease-in;
    visibility: visible;
    opacity: 1;
    left: -60px;
}

.message-item__content--card {
    position: relative;
}

.message-item--me .message-item__content--card::after {
    content: "";
    position: absolute;
    background-color: #1e88e5;
    width: 3px;
    right: 0px;
    bottom: 0;
    top: 0;
}

.message-item--deleted .message-item__content--card::after {
    background-color: red;
}

.message-item.message-item--editing .message-item__content--card::after {
    background-color: var(--primary-color);
}

.message-item__content-actions {
    opacity: 0.2;
}

div:not(.message-item--deleted)
    .message-item__content:hover
    .message-item__content-actions {
    transition: all 0.1s ease-in;
    opacity: 01;
}

.user-name::after {
    content: "\2022";
    padding-left: 5px;
    padding-right: 5px;
    color: hsl(0, 0%, 72%);
}

/* Marker */
.message-item__mark-container {
    position: absolute;
    left: -10px;
    top: 8px;
}

.btn-mention {
    cursor: default;
}

.mark-item {
    height: 28px;
    width: 28px;
    will-change: box-shadow;
    cursor: default;
    font-size: 0.75rem;
    -webkit-appearance: button;
    align-items: center;
    display: inline-flex;
    flex: 0 0 auto;
    font-weight: 500;
    letter-spacing: 0.0892857143em;
    justify-content: center;
    user-select: none;
    vertical-align: middle;
    white-space: nowrap;
    position: relative;
}

.mark-item.rounded {
    border-radius: 50%;
}
</style>

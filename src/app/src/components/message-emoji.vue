<template>
    <v-scale-transition>
        <div class="reaction-emoji">
            <div
                class="emoji-panel px-1"
                v-show="emojis.length > 0"
            >
                <template v-for="reaction in emojis">
                    <v-icon
                        size="16"
                        class="mr-1"
                        :key="reaction.type + '-icon'"
                        :class="{ 'my-reaction': reaction.mine == true }"
                        :color="reaction.color"
                        v-text="'mdi-' + reaction.icon"
                        @click="
                            reaction.mine == true ? onReaction(reaction) : ''
                        "
                    ></v-icon>
                </template>
                <small v-text="emojis.length"></small>
            </div>
        </div>
    </v-scale-transition>
</template>

<script>
import { mapState } from "vuex";
export default {
    props: {
        message: Object,
    },
    data() {
        return {
            emojis: [],
        };
    },
    computed: {
        ...mapState({
            me: state => state.users.me,
        }),
    },
    watch: {
        "message.reactions"() {
            this.emojis = this.getEmojis();
        },
    },
    created() {
        this.emojis = this.getEmojis();
    },
    methods: {
        getReactionStyle(type) {
            let icon = "";
            let color = "yellow darken-3";
            switch (type) {
                case "like":
                    icon = "thumb-up";
                    break;
                case "heart":
                    icon = "heart";
                    color = "red darken-1";
                    break;
                case "happy":
                    icon = "emoticon-excited";
                    break;
                case "angry":
                    icon = "emoticon-angry";
                    color = "red light-1";
                    break;
                case "cry":
                    icon = "emoticon-cry";
                    color = "blue light-1";
                    break;

                default:
                    break;
            }
            return { icon, color };
        },
        onReaction(reaction) {
            this.$emit("change", reaction.type);
        },
        getEmojis() {
            if (!this.message.reactions || this.message.reactions.length <= 0) {
                return [];
            }

            const emojis = {};
            this.message.reactions.forEach(reaction => {
                const style = this.getReactionStyle(reaction.type);
                if (!emojis[reaction.type]) {
                    emojis[reaction.type] = {
                        mine: this.me.id == reaction.user,
                        type: reaction.type,
                        ...style,
                        reactors: [reaction.user],
                    };
                } else {
                    emojis[reaction.type].reactors.push(reaction.user);
                    emojis[reaction.type].mine |= reaction.user;
                }
            });

            return Object.values(emojis);
        },
    },
};
</script>

<style scoped>
.reaction-emoji {
    height: 24px;
}

.emoji-panel {
    display: flex;
    align-items: center;
    -webkit-box-align: center;
}

.emoji-panel:hover *:not(.my-reaction) {
    opacity: 0.6;
    transition: all 0.2s ease-in-out;
    transform: scale(0.9);
    cursor: default;
}

.emoji-panel:hover .v-icon.my-reaction {
    transition: all 0.2s ease-in-out;
    transform: scale(1.1);
}

.emoji-panel .v-icon.my-reaction:hover {
    transition: all 0.2s ease-in-out;
    opacity: 1;
    transform: scale(1.2);
}
</style>

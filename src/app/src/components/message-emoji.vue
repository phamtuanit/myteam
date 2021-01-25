<template>
    <v-scale-transition>
        <div class="reaction-emoji">
            <div
                class="emoji-panel px-1 center-y"
                v-show="emojis.length > 0"
            >
                <div class="emoji-panel_content center-y">
                    <template v-for="reaction in emojis">
                        <v-menu
                            top
                            left
                            nudge-left="18"
                            open-on-hover
                            :key="reaction.type + '-icon'"
                            content-class="elevation-1"
                        >
                            <template v-slot:activator="{ on }">
                                <span class="emoji-item-wrapper" :title="`:${reaction.type}:`"
                                        :class="{'my-reaction': reaction.mine == true,}"
                                        @mouseenter="on.mouseenter" @mouseleave="on.mouseleave"
                                        @click="reaction.mine == true ? onReaction(reaction, on) : undefined">
                                    <span :class="reaction.icon"></span>
                                </span>
                            </template>
                            <!-- Reactors -->
                            <v-list
                                class="emoji-reactors"
                                elevation="0"
                                max-height="200"
                            >
                                <v-list-item
                                    v-for="user in reaction.reactors"
                                    :key="user.id"
                                    class="px-3 py-1"
                                    v-text="user.name"
                                >
                                </v-list-item>
                            </v-list>
                        </v-menu>
                    </template>
                </div>
                <!-- count -->
                <v-menu
                    top
                    left
                    nudge-left="10"
                    open-on-hover
                    content-class="elevation-1"
                >
                    <template v-slot:activator="{ on }">
                        <small v-on="on" v-text="totalReactor"></small>
                    </template>
                    <!-- Detail -->
                    <v-list
                        class="emoji-count"
                        elevation="0"
                    >
                        <v-list-item
                            v-for="reaction in emojis"
                            :key="reaction.type"
                            class="px-3 py-1"
                        >
                            <span class="mr-2 emoji-item-wrapper" :title="`:${reaction.type}:`">
                                <span :class="reaction.icon"></span>
                            </span>
                            <small v-text="reaction.reactors.length"></small>
                        </v-list-item>
                    </v-list>
                </v-menu>
            </div>
        </div>
    </v-scale-transition>
</template>

<script>
import { mapState } from "vuex";
import { getEmotions } from '../utils/emotion.js'
const emotions = getEmotions();
export default {
    props: {
        message: Object,
    },
    data() {
        return {
            emojis: [],
            totalReactor: 0,
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
            return emotions.find(i => i.type == type);
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
                        reactors: [{ id: reaction.user, name: "" }],
                    };
                } else {
                    emojis[reaction.type].reactors.push({
                        id: reaction.user,
                        name: "",
                    });
                    emojis[reaction.type].mine |= this.me.id == reaction.user;
                }
            });

            // Collect reactors
            const reactors = [];
            Object.values(emojis).forEach(r => {
                reactors.splice(reactors - 1, 0, ...r.reactors);
            });

            this.totalReactor = reactors.length;
            const userIds = reactors.map(u => u.id);
            this.$store
                .dispatch("users/resolve", userIds)
                .then(users => {
                    reactors.forEach(tmpUser => {
                        const userObj = users.find(u => u.id == tmpUser.id);
                        if (userObj) {
                            Object.assign(tmpUser, userObj);
                            tmpUser.name = tmpUser.fullName || tmpUser.userName;
                        }
                    });
                })
                .catch(console.error);

            return Object.values(emojis);
        },
    },
};
</script>

<style lang="scss">
.emoji-panel {
    display: flex;
    align-items: center;
    -webkit-box-align: center;

    .emoji-item-wrapper {
        display: inline-block;
        font-size: 0;
        margin-right: 6px;
        cursor: default;
    }

    .emoji-item-wrapper .emoji-type-image {
        width: 17px;
        height: 17px;
    }

    .emoji-item-wrapper span {
        display: inline-block;
    }
}

.emoji-count {
    .emoji-item-wrapper {
        display: inline-block;
        font-size: 0;
        margin-right: 2px;
    }

    .emoji-item-wrapper .emoji-type-image {
        width: 17px;
        height: 17px;
    }

    .emoji-item-wrapper span {
        display: inline-block;
    }
}

.emoji-panel:hover .emoji-item-wrapper.my-reaction {
    animation: my-reaction-opacity 1s linear infinite;
    cursor: pointer;;
}

@keyframes my-reaction-opacity {
    0% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.5;
        transform: scale(1.2);
    }
    100% {
        opacity: 1;
        transform: scale(1);
    }
}

.v-list.emoji-reactors,
.v-list.emoji-count {
    padding: 4px 0 4px 0;
}

.v-list.emoji-count .v-list-item,
.v-list.emoji-reactors .v-list-item {
    min-height: 0;
}
</style>

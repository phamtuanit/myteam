<template>
    <div class="reactions-wrapper">
        <v-card class="reactions-panel py-1 px-1" elevation="1">
            <span v-for="reaction in reactions" :key="reaction.type" class="emoji-item-wrapper"
                    :class="{ selected: reaction.type == selected }" :title="`:${reaction.type}:`"
                    @click="onReact($event, reaction)">
                <span :class="reaction.icon"></span>
            </span>
        </v-card>
    </div>
</template>

<script>
import { getEmotions } from '../utils/emotion.js'
export default {
    props: ["selected"],
    data: () => ({
        reactions: getEmotions(),
    }),
    methods: {
        onReact(e, reaction) {
            if (reaction.type === this.selected) {
                return;
            }
            this.attachEffect(e, reaction);
            this.$emit("react", reaction);
        },
        attachEffect(e, reaction) {
            const effectEl = document.createElement("div");
            const color = reaction.color;
            effectEl.className = "emoji-click-effect";
            effectEl.style.borderColor = color;
            effectEl.style.top = (e.clientY) + "px";
            effectEl.style.left = (e.clientX) + "px";
            this.$el.appendChild(effectEl);
            effectEl.addEventListener("animationend", function() {
                effectEl.parentElement.removeChild(effectEl);
            }.bind(this));
        },
    },
};
</script>

<style lang="scss">
.reactions-wrapper {
    width: 164px;
    height: 26px;
    position: relative;
    z-index: 1;

    .emoji-item-wrapper {
        display: inline-block;
        font-size: 0;
        padding-left: 3px;
        padding-right: 3px;
    }

    .emoji-item-wrapper .emoji-type-image {
        width: 19px;
        height: 19px;
    }

    .emoji-item-wrapper span {
        display: inline-block;
    }

    .reactions-panel .emoji-item-wrapper {
        cursor: pointer;
    }

    .reactions-panel {
        display: flex;
        -webkit-box-align: center;
        align-items: center;
        border-radius: 5px;
        z-index: 9;
    }

    .reactions-panel:hover .emoji-item-wrapper {
        transition: all 0.2s ease-in;
        opacity: 0.5;
    }

    @keyframes opacity {
        0% {
            opacity: 0.5;
            transform: scale(1);
        }
        50% {
            opacity: 1;
            transform: scale(1.2);
        }
        100% {
            opacity: 0.5;
            transform: scale(1);
        }
    }

    .reactions-panel .emoji-item-wrapper.selected {
        animation: opacity 1s linear infinite;
        cursor: default;
    }

    .reactions-panel .emoji-item-wrapper:hover {
        transition: all 0.2s ease-in;
        opacity: 1;
        transform: scale(1.2);
    }

    .reactions-panel.v-card {
        border-radius: 14px;
    }

    div.emoji-click-effect{
        position:fixed;
        box-sizing: border-box;
        border-style: solid;
        border-radius: 50%;
        animation: emoji-click-effect 0.4s ease-out;
        z-index: 99999;
    }

    @keyframes emoji-click-effect{
        0% {
            width: 0.25rem;
            height: 0.25rem;
            margin: -0.125rem;
            opacity: 1;
            border-width: 0.5em;
        }
        100% {
            opacity: 0.2;
            width: 8rem;
            height: 8rem;
            margin: -4rem;
            border-width: 0.03em;
        }
    }
}
</style>

<template>
    <div class="reactions-wrapper">
        <v-card class="reactions-panel py-1 px-1" elevation="1">
            <v-icon
                v-for="reaction in reactions"
                :key="reaction.type"
                size="18"
                class="ml-2"
                :class="{ selected: reaction.type == selected }"
                :title="`:${reaction.type}:`"
                @click="onReact(reaction)"
                :color="reaction.color"
                v-text="'mdi-' + reaction.icon"
            ></v-icon>
        </v-card>
        <v-spacer></v-spacer>
    </div>
</template>

<script>
export default {
    props: ["selected"],
    data: () => ({
        reactions: [
            {
                type: "like",
                icon: "thumb-up",
                color: "yellow darken-3",
            },
            {
                type: "heart",
                icon: "heart",
                color: "red darken-1",
            },
            {
                type: "happy",
                icon: "emoticon-excited",
                color: "yellow darken-3",
            },
            {
                type: "cry",
                icon: "emoticon-cry",
                color: "blue light-1",
            },
            {
                type: "angry",
                icon: "emoticon-angry",
                color: "red light-1",
            },
        ],
    }),
    methods: {
        onReact(reaction) {
            this.$emit("react", reaction);
        },
    },
};
</script>

<style scoped>
.reactions-wrapper {
    display: flex;
    align-items: center;
    -webkit-box-align: center;
    -webkit-box-flex: 1;
    background: transparent;
    height: 26px;
}

.reactions-panel .v-icon {
    cursor: pointer;
}

.reactions-panel {
    display: flex;
    -webkit-box-align: center;
    align-items: center;
    border-radius: 5px;
}

.reactions-panel:hover .v-icon {
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

.reactions-panel .v-icon.selected {
    animation: opacity 1s linear infinite;
    cursor: default;
}

.reactions-panel .v-icon:hover {
    transition: all 0.2s ease-in;
    opacity: 1;
    transform: scale(1.2);
}

.reactions-panel.v-card {
    border-radius: 14px;
}
</style>

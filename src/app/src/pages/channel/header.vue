<template>
    <v-sheet
        height="57"
        min-height="57"
        class="pa-0 no-border-radius center-y px-3"
    >

        <v-icon>mdi-pound</v-icon>
        <v-list-item-title
            class="title ml-1"
            v-text="conversation.name"
        ></v-list-item-title>

        <v-spacer></v-spacer>
        <!-- Setting -->
        <v-btn
            icon
            @click="onSetting"
        >
            <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>

        <!-- Dialog -->
        <ChannelSetting
            v-model="convCopy"
            :display="displaySetting"
            @close="displaySetting = false"
            @submit="onSaveSetting"
        ></ChannelSetting>
    </v-sheet>
</template>

<script>
import ChannelSetting from "./channel-setting.vue";
export default {
    props: {
        conversation: {
            type: Object,
            default: () => ({})
        },
    },
    components: { ChannelSetting },
    data: () => {
        return {
            convCopy: {},
            displaySetting: false,
        };
    },
    methods: {
        onSetting() {
            this.convCopy = { ...this.conversation };
            this.displaySetting = true;
        },
        onSaveSetting(convInfo) {
            convInfo.id = this.conversation.id;
            return this.$store
                .dispatch("conversations/updateConversation", convInfo)
                .then(conv => {
                    this.displaySetting = false;
                })
                .catch(console.error);
        },
    },
};
</script>

<style>
</style>

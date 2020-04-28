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
        <v-menu left>
            <template v-slot:activator="{ on }">
                <v-btn icon small v-on="on" class="mx-auto">
                    <v-icon small>mdi-dots-vertical</v-icon>
                </v-btn>
            </template>
            <v-list class="menus"
                ><v-list-item @click="onSetting">
                    <v-list-item-title>Setting</v-list-item-title>
                </v-list-item>
                <v-list-item @click="onDelete">
                    <v-list-item-title>Delete</v-list-item-title>
                </v-list-item>
            </v-list>
        </v-menu>

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
            default: () => ({}),
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
        onDelete() {
            return this.$store
                .dispatch("conversations/deleteConversation", this.conversation.id)
                .catch(console.error);
        }
    },
};
</script>

<style></style>

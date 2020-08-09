<template>
    <v-sheet
        height="57"
        min-height="57"
        class="channel-header pa-0 no-border-radius pl-6 pr-0"
    >
        <div class="center-y" style="height: 100%;" v-show="conversation.id">
            <v-icon>mdi-pound</v-icon>
            <v-list-item-title
                class="title ml-1"
                v-text="conversation.name"
            ></v-list-item-title>

            <v-spacer></v-spacer>
            <slot name="commands"></slot>
            <!-- Pinned message -->
            <v-btn icon small class="mr-2 btn-pin" title="Pin messages"
                :class="state.activePinnedMessages == true ? 'pin-activated' : ''" @click="onPin">
                <v-icon small v-text="state.activePinnedMessages == true ? 'mdi-pin' : 'mdi-pin-off-outline'"></v-icon>
            </v-btn>
            <!-- Setting -->
            <v-menu offset-y right>
                <template v-slot:activator="{ on }">
                    <v-btn icon small v-on="on" class="mx-auto mr-2" title="Settings">
                        <v-icon small>mdi-dots-vertical</v-icon>
                    </v-btn>
                </template>
                <v-list class="menus">
                    <template v-if="conversation.creator === me.id">
                        <v-list-item @click="onSetting">
                            <v-list-item-title>Settings</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="onDelete">
                            <v-list-item-title class="red--text"
                                >Delete</v-list-item-title
                            >
                        </v-list-item>
                    </template>
                    <v-list-item
                        v-show="conversation.creator != me.id"
                        @click="onLeave"
                    >
                        <v-list-item-title class="red--text"
                            >Leave</v-list-item-title
                        >
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
        </div>
    </v-sheet>
</template>

<script>
import ChannelSetting from "./channel-setting.vue";
import { mapState } from "vuex";
export default {
    props: {
        conversation: {
            type: Object,
            default: () => ({}),
        },
        state: {
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
    computed: {
        ...mapState({
            me: state => state.users.me,
        }),
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
                .then(() => {
                    this.displaySetting = false;
                })
                .catch(console.error);
        },
        onDelete() {
            return this.$store
                .dispatch(
                    "conversations/deleteConversation",
                    this.conversation.id
                )
                .catch(console.error);
        },
        onLeave() {
            return this.$store
                .dispatch(
                    "conversations/leaveConversation",
                    this.conversation.id
                )
                .catch(console.error);
        },
        onPin() {
            this.$emit("pin", this.conversation);
        }
    },
};
</script>


<style>
.channel-header .btn-pin {
    transform: rotateZ(45deg);
}

.channel-header .btn-pin.pin-activated {
    transform: rotateZ(0deg);
}
</style>
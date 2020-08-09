<template>
    <div class="pinned-messages fill-height d-flex flex-column">
        <!-- Search -->
        <v-sheet class="pinned-messages--title pa-0 center-y no-border-radius">
            <v-subheader class="ml-0 selection-disabled"
                >Pinned messages
            </v-subheader>
            <v-spacer></v-spacer>
            <v-btn
                fab
                class="mr-3 btn-refresh"
                rounded
                icon
                height="26"
                width="26"
                title="Refresh"
                @click="onRefresh"
            >
                <v-icon>mdi-refresh</v-icon>
            </v-btn>
        </v-sheet>
        <v-progress-linear
            :active="loading"
            :indeterminate="true"
        ></v-progress-linear>

        <!-- Messages -->
        <v-list class="pinned-messages-list py-0 px-0">
            <div class="pinned-messages-content overflow-y-auto">
                <template v-for="msg in messages">
                    <v-divider :key="msg.id + '-divider'"></v-divider>
                    <PinnedMessage :key="msg.id" class="px-4" :message="msg">
                    </PinnedMessage>
                </template>
            </div>
        </v-list>
    </div>
</template>

<script>
import { fillHeight } from "../../utils/layout.js";
import PinnedMessage from "./pinned-message";
export default {
    components: { PinnedMessage },
    props: {
        conversation: {
            type: Object,
            default: () => ({}),
        },
    },
    data() {
        return {
            loading: false,
            messages: [],
        };
    },
    created() {
        this.onRefresh();
    },
    mounted() {
        fillHeight("pinned-messages-content", 0, this.$el);
        this.friendList = this.cachedUsers;
    },
    destroyed() {
        this.conversation.pinnedMessages.splice(0);
    },
    methods: {
        onRefresh() {
            return this.$store
                .dispatch("conversations/getPinnedMessage", {
                    convId: this.conversation.id,
                })
                .then(() => {
                    this.messages = this.conversation.pinnedMessages;
                })
                .catch(console.error);
        },
    },
};
</script>

<style>
.pinned-messages {
    max-width: 20vw;
}

.pinned-messages-list  {
    height: 100%;
    max-height: 100%;
}

.pinned-messages .pinned-messages--title {
    min-width: 20vw;
}

.pinned-messages--title .btn-refresh {
    opacity: 0.4;
}

.pinned-messages--title:hover .btn-refresh {
    opacity: 1;
}
</style>

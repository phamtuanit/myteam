<template>
    <div class="conversation-content pa-0 ma-0 d-flex flex-column">
        <!-- Header -->
        <v-sheet height="57" class="pa-0 no-border-radius"></v-sheet>
        <v-divider></v-divider>

        <!-- Content -->
        <v-sheet
            class="message-sheet flex-grow-1 overflow-y-auto no-border-radius transparent"
            v-chat-scroll="{ always: false, smooth: true }"
            @click="onRead"
        ></v-sheet>

        <!-- Input -->
        <v-sheet height="60" class="no-border-radius"
        ></v-sheet>
    </div>
</template>

<script>
export default {
    props: {
        conversation: Object,
    },
    methods: {
        onRead() {
            const conv = this.conversation;
            if (conv && conv.meta.unreadMessage.length > 0) {
                this.$store
                    .dispatch("conversations/watchAllMessage", conv.id)
                    .catch(console.error);
            }
        },
    },
};
</script>



<style lang="css" scoped>
.conversation-content {
    height: 100vh;
}

/* Messages */
/* .conversation-content >>> .message-sheet {
    background: transparent;
} */
</style>

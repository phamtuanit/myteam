<template>
    <v-list-item
        class="px-2 message-item my-message"
        :class="{ 'message-error': hasError }"
    >
        <v-list-item-avatar></v-list-item-avatar>
        <v-spacer></v-spacer>
        <v-card flat class="mr-1 message-card py-1" :disabled="hasError">
            <div class="py-1 px-4 card-header">
                <span class="caption" v-text="time"></span>
                <v-spacer></v-spacer>
                <v-icon v-if="hasError" small color="red lighten-1" class="ml-2"
                    >mdi-alert</v-icon
                >
            </div>
            <v-card-text class="pt-0 pb-1 px-4" v-html="message.body.content">
            </v-card-text>
        </v-card>
    </v-list-item>
</template>

<script>
export default {
    props: ["index", "message"],
    computed: {
        time() {
            return new Date(this.message.arrivalTime).toLocaleString();
        },
        hasError() {
            return (
                typeof this.message.status == "string" &&
                this.message.status != "valid"
            );
        },
    },
};
</script>

<style scoped>
.card-header {
    position: relative;
    display: flex;
    align-items: center;
    -webkit-box-align: center;
    -webkit-box-flex: 1;
}

.message-error >>> .message-card {
    border-bottom-color: #ef5350c7;
    border-bottom-width: 1px;
    border-bottom-style: solid;
}

.message-card {
    position: relative;
}

.message-card.v-card::before {
    position: absolute;
    content: " ";
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 0;
    background-color: rgba(25, 118, 210, 0.07);
}
</style>

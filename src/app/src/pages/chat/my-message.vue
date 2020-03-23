<template>
    <v-list-item
        class="px-2 message-item my-message"
        :class="{ 'message-error': hasError }"
    >
        <v-list-item-avatar></v-list-item-avatar>
        <v-spacer></v-spacer>
        <v-card flat class="mr-1 message-card py-1" :disabled="hasError">
            <div class="py-1 px-4">
                <span class="caption" v-text="time"></span>
                <v-icon v-if="hasError" small color="red lighten-1" class="mx-2"
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
.message-error >>> .message-card {
    border-bottom-color: #ef5350;
    border-bottom-width: 2px;
    border-bottom-style: solid;
}
</style>

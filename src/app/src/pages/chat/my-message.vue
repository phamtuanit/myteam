<template>
    <v-list-item
        class="px-2 message-item my-message"
        :class="{ 'message-error': !isAvailable }"
    >
        <div style="min-width: 20px;"></div>
        <v-spacer></v-spacer>
        <!-- Actions -->
        <div class="message-actions mr-1" v-if="isAvailable">
            <v-btn icon small class="mx-auto" @click="onDeleteMessage">
                <v-icon small>mdi-delete</v-icon>
            </v-btn>
        </div>
        <div style="min-width: 40px;" v-else>
            <!-- Empty space -->
        </div>

        <!-- Content -->
        <div class="message-content">
            <v-card
                flat
                class="mr-1 message-card py-1 px-3"
                :disabled="!isAvailable"
            >
                <!-- Header -->
                <div class="message-card__header selection-disabled mb-0">
                    <span class="caption" v-text="timeAgo"></span>
                    <v-spacer></v-spacer>
                    <v-icon
                        v-if="!isAvailable"
                        small
                        color="red lighten-1"
                        class="ml-2"
                        v-text="warnIcon"
                    ></v-icon>
                    <!-- Reacted Emoji -->
                    <ReactionEmoji
                        :message="message"
                        class="ml-2"
                    ></ReactionEmoji>
                </div>
                <!-- Body -->
                <v-card-text
                    class="message-card_text pa-0 my-0 hl"
                    v-html="message.body.content"
                >
                </v-card-text>
            </v-card>
        </div>
    </v-list-item>
</template>

<script>
import ReactionEmoji from "../../components/message-emoji.vue";
import mixin from "../../mixin/message.mix.js";
export default {
    mixins: [mixin],
    components: { ReactionEmoji },
    data() {
        return {
            messageStatus: null,
        };
    },
    computed: {
        isAvailable() {
            return !this.message.status;
        },
        warnIcon() {
            if (this.isAvailable) {
                return "";
            }

            switch (this.messageStatus) {
                case "rejected":
                    return "mdi-alert";
                case "removed":
                    return "mdi-delete-variant";

                default:
                    break;
            }

            return "";
        },
    },
    watch: {
        message: {
            deep: true,
            handler(val) {
                this.messageStatus = val.status;
            },
        },
    },
    created() {
        if (!("status" in this.message)) {
            this.$set(this.message, "status", null);
        }
    },
    methods: {
        onDeleteMessage() {
            this.$emit("delete", this.message);
        },
    },
};
</script>

<style scoped>
.message-content {
    padding-top: 2px;
    padding-bottom: 2px;
}

.message-card__header {
    position: relative;
    display: flex;
    align-items: center;
    -webkit-box-align: center;
    -webkit-box-flex: 1;
}

.message-card {
    position: relative;
}

.message-card::after {
    content: "";
    position: absolute;
    background-color: #1e88e5;
    width: 3px;
    right: 0px;
    bottom: 0;
    top: 0;
    border-radius: 0 4px 4px 0;
}

.message-error .message-card::after {
    background-color: red;
}

.message-card .message-card_text {
    color: rgba(0, 0, 0, 0.8);
}

.theme--dark .message-card .message-card_text {
    color: rgba(255, 255, 255, 0.8);
}

.my-message.v-list-item {
    min-height: 0px;
}
</style>

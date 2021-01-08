<template>
    <v-list-item
        class="px-2 message-item my-message"
        :class="{ 'message-error': !isAvailable }"
    >
        <div style="min-width: 8px;"></div>
        <v-spacer></v-spacer>
        <!-- Actions -->
        <div
            class="message-item__actions d-flex justify-end mr-1"
            style="min-width: 40px;"
        >
            <v-btn
                icon
                small
                class="mx-auto"
                @click="onDeleteMessage"
                v-if="isAvailable"
            >
                <v-icon small color="red">mdi-delete</v-icon>
            </v-btn>
        </div>

        <!-- Content -->
        <div class="message-item__content">
            <v-card
                flat
                class="mr-1 message-item__content--card py-1 px-3"
                :disabled="!isAvailable"
            >
                <!-- Header -->
                <div class="message-item__content-header selection-disabled mb-0">
                    <span
                        class="caption"
                        v-text="timeAgo"
                    ></span>
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
                    class="message-item__content-text pa-0 my-0 hl"
                    v-html="message.body.content + `<div class='clearfix'></div>`"
                >
                </v-card-text>
            </v-card>
        </div>
    </v-list-item>
</template>

<script>
import ReactionEmoji from "../../components/message-emoji.vue";
import messageMixin from "../../mixin/message.mix.js";
import imgZoomMixin from "../../mixin/img-zoom.mix.js";
export default {
    mixins: [messageMixin, imgZoomMixin],
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

<style>
.message-item.my-message .message-item__content-header {
    position: relative;
    display: flex;
    align-items: center;
    -webkit-box-align: center;
    -webkit-box-flex: 1;
}

.message-item.my-message .message-item__content--card::after {
    content: "";
    position: absolute;
    background-color: #1e88e5;
    width: 3px;
    right: 0px;
    bottom: 0;
    top: 0;
    border-radius: 0 4px 4px 0;
}

.message-item.my-message.message-error .message-item__content--card::after {
    background-color: red;
}

.message-item.my-message .message-item__content--card .message-item__content-text {
    padding-bottom: 2px !important;
}

.my-message.v-list-item {
    min-height: 0px;
}
</style>

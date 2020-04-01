<template>
  <v-list-item
    class="px-2 message-item my-message"
    :class="{ 'message-error': !isAvailable }"
  >
    <v-spacer></v-spacer>
    <!-- Actions -->
    <div
      class="message-actions mr-1"
      v-if="isAvailable"
    >
      <v-btn
        icon
        small
        class="mx-auto"
        @click="onDeleteMessage"
      >
        <v-icon small>mdi-delete</v-icon>
      </v-btn>
    </div>
    <v-list-item-avatar v-else>
      <!-- Empty space -->
    </v-list-item-avatar>

    <!-- Content -->
    <v-card
      flat
      class="mr-1 message-card py-1"
      :disabled="!isAvailable"
    >
      <div class="py-1 px-4 card-header selection-disabled">
        <span
          class="caption"
          v-text="time"
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
      <v-card-text
        class="py-0 px-4"
        v-html="message.body.content"
      >
      </v-card-text>
    </v-card>
  </v-list-item>
</template>

<script>
import ReactionEmoji from "../../components/message-emoji.vue";
export default {
    props: ["message"],
    components: { ReactionEmoji },
    data() {
        return {
            messageStatus: null,
        };
    },
    computed: {
        time() {
            return new Date(this.message.arrivalTime).toLocaleString();
        },
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
.card-header {
    position: relative;
    display: flex;
    align-items: center;
    -webkit-box-align: center;
    -webkit-box-flex: 1;
}

.message-error >>> .message-card {
    border-bottom-color: #ef5350c7;
    border-bottom-width: 2px;
    border-bottom-style: solid;
}

.message-card {
    position: relative;
}

.message-card.v-card::before {
    position: absolute;
    content: " ";
    border-radius: 4px;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 0;
    background-color: rgba(73, 159, 245, 0.2);
}
</style>

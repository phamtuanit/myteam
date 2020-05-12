<template>
    <div class="chat-editor d-flex flex-column">
        <v-sheet
            class="chat-editor__container"
            :class="{
                'theme--dark': $vuetify.theme.isDark,
                'chat-editor-expanded': showToolBar,
            }"
        >
            <Editor
                v-model="internalValue"
                :config="editorConfig"
                :show-tool-bar="showToolBar"
                @ready="onEditorReady"
            />
        </v-sheet>

        <v-sheet
            class="transparent d-flex justify-space-between mt-1 chat-editor__actions"
        >
            <!-- Start -->
            <div class="d-flex flex-align-start">
                <EmojiButton
                    size="18"
                    v-model="emojiPopup"
                    @select="onSelectEmoji"
                ></EmojiButton>
                <v-btn
                    icon
                    @click="showToolBar = !showToolBar"
                    title="Format (ESC)"
                >
                    <v-icon size="18" :color="showToolBar ? 'orange' : ''"
                        >mdi-format-letter-case-upper</v-icon
                    >
                </v-btn>
            </div>
            <!-- End -->
            <v-btn
                icon
                :loading="isSending"
                :color="isSending ? 'orange' : ''"
                @click="onSend"
                title="Send (Enter)"
            >
                <v-icon size="18">mdi-send</v-icon>
            </v-btn>
        </v-sheet>
    </div>
</template>

<script>
import EmojiButton from "..//emoji-button";
import Editor from "./ck-editor.vue";

// Editor
import MyEnter from "./plugins/enter";
import MyMention from "./plugins/mention";
import ClassicEditor from "./ck-editor.js";

ClassicEditor.builtinPlugins.push(MyEnter, MyMention);

export default {
    props: {
        value: {
            type: String,
            default: null,
        },
        id: {
            type: [String, Number],
            default: "",
        },
        mention: {
            type: Object,
            default: null,
        },
        sending: {
            type: Boolean,
            default: false,
        },
    },
    components: { EmojiButton, Editor },
    data() {
        return {
            classEditor: ClassicEditor,
            showToolBar: false,
            internalValue: this.value,
            emojiPopup: false,
            isSending: this.sending,
            editorConfig: {
                simpleUpload: {
                    id: this.id,
                },
                mention: this.mention,
            },
        };
    },
    watch: {
        internalValue() {
            this.$emit("input", this.internalValue);
        },
        showToolBar(val) {
            if (val == true) {
                const editable = this.editorInstance.ui.view.editable;
                editable.element.focus();
            }
            this.changePluginStatus();
        },
        value(val) {
            if (this.internalValue !== val) {
                this.internalValue = val;

                if (!val) {
                    this.showToolBar = false;
                }
            }
        },
        sending(val) {
            if (val) {
                setTimeout(() => {
                    this.isSending = this.sending;
                }, 1000);
            } else {
                this.isSending = val;
            }
        },
    },
    methods: {
        onSelectEmoji(emoji) {
            if (emoji.native) {
                this.writeText(emoji.native);
            }
        },
        onEditorReady(editorInstance) {
            this.editorInstance = editorInstance;
            this.changePluginStatus();
            // Register Enter command
            this.editorInstance.keystrokes.set("enter", (data, cancel) => {
                if (this.showToolBar != true) {
                    cancel();
                    this.triggerSendEvent();
                }
            });

            //  Show/die format tollbar
            this.editorInstance.keystrokes.set("esc", (data, cancel) => {
                cancel();
                this.showToolBar = !this.showToolBar;
            });

            // Show emoji
            this.editorInstance.keystrokes.set(
                "Ctrl+Shift+S",
                (data, cancel) => {
                    cancel();
                    this.emojiPopup = !this.emojiPopup;
                }
            );

            this.$emit("ready");
        },
        onSend() {
            this.$emit("send", this.internalValue);
        },
        triggerSendEvent() {
            const currVal = this.editorInstance.getData();
            if (currVal !== this.value) {
                // Incase user type fast
                setTimeout(this.triggerSendEvent, 0);
                return;
            }

            this.$emit("send", currVal);
        },
        writeText(text) {
            const editor = this.editorInstance;
            editor.model.change(writer => {
                const insertPosition = editor.model.document.selection.getLastPosition();
                writer.insertText(text, insertPosition);
            });
        },
        changePluginStatus() {
            if (!this.editorInstance) {
                return;
            }

            // Change Enter status
            const enterPlugin = this.editorInstance.plugins.get("MyEnter");
            if (enterPlugin) {
                const key = "MyEnter" + this.id;
                if (this.showToolBar) {
                    enterPlugin.clearForceDisabled(key);
                } else {
                    enterPlugin.forceDisabled(key);
                }
            }
        },
    },
};
</script>

<style>
.chat-editor__container:not(.chat-editor-expanded)
    .ck.ck-editor__editable_inline
    > :first-child {
    margin-top: 6px;
}

.chat-editor__container:not(.chat-editor-expanded)
    .ck.ck-editor__editable_inline
    > :last-child {
    margin-bottom: 6px;
}

.chat-editor-expanded .ck .ck-editor__editable_inline {
    max-height: 60vh;
    height: 40vh;
}

.chat-editor__actions .v-btn.v-size--default {
    height: 30px;
    width: 30px;
}
</style>

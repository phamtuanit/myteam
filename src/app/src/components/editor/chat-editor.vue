<template>
    <div class="chat-editor d-flex flex-column">
        <v-sheet
            class="chat-editor__container"
            :class="{ 'theme-dark': $vuetify.theme.isDark }"
        >
            <Editor
                v-model="value"
                :show-tool-bar="showToolBar"
                @ready="onEditorReady"
            />
        </v-sheet>

        <v-sheet class="transparent d-flex justify-space-between mt-1">
            <!-- Start -->
            <div class="d-flex flex-align-start">
                <EmojiButton @select="onSelectEmoji"></EmojiButton>
                <v-btn icon @click="showToolBar = !showToolBar">
                    <v-icon :color="showToolBar ? 'orange' : ''"
                        >mdi-format-letter-case-upper</v-icon
                    >
                </v-btn>
            </div>
            <!-- End -->
            <v-btn icon @click="onSend">
                <v-icon>mdi-send</v-icon>
            </v-btn>
        </v-sheet>
    </div>
</template>

<script>
import EmojiButton from "..//emoji-button";
import Editor from "./ck-editor.vue";

// Editor
import ClassicEditor from "./ck-editor.js";
// Remove Entr plugin
const enterIndex = ClassicEditor.builtinPlugins.findIndex(
    (i) => i.pluginName == "Enter"
);

if (enterIndex >= 0) {
    ClassicEditor.builtinPlugins.splice(enterIndex, 1);
}

export default {
    props: {
        value: {
            type: String,
            default: null,
        },
    },
    components: { EmojiButton, Editor },
    data() {
        return {
            classEditor: ClassicEditor,
            showToolBar: false,
        };
    },
    methods: {
        onSelectEmoji(emoji) {
            if (emoji.native) {
                this.writeText(emoji.native);
            }
        },
        onEditorReady(editorInstance) {
            this.editorInstance = editorInstance;
            // Register Enter command
            this.editorInstance.keystrokes.set("Enter", (data, cancel) => {
                this.$emit("enter", data, cancel);
            });
        },
        onSend() {
            this.$emit("send", this.value);
        },
        writeText(text) {
            const editor = this.editorInstance;
            editor.model.change((writer) => {
                const insertPosition = editor.model.document.selection.getLastPosition();
                writer.insertText(text, insertPosition);
            });
        },
    },
};
</script>

<style>
.chat-editor__container .ck.ck-editor__editable_inline > :first-child {
    margin-top: 12px;
}

.chat-editor__container .ck.ck-editor__editable_inline > :last-child {
    margin-bottom: 12px;
}
</style>

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
                <!-- Emoji -->
                <EmojiButton
                    size="18"
                    v-model="emojiPopup"
                    @select="onSelectEmoji"
                ></EmojiButton>
                <!-- Gifs -->
                <Giphy size="18" @select="onSelectGif"></Giphy>
                <!-- Format -->
                <v-btn
                    icon
                    @click="showToolBar = !showToolBar"
                    title="Format (ESC)"
                >
                    <v-icon size="18" :class="showToolBar ? 'color-1' : ''"
                        >mdi-format-letter-case-upper</v-icon
                    >
                </v-btn>
            </div>
            <!-- End -->
            <div class="d-flex flex-align-end">
                <!-- Send -->
                <v-btn
                    icon
                    :loading="isSending"
                    :class="isSending ? 'color-1' : ''"
                    @click="onSend"
                    title="Send (Enter)"
                >
                    <v-icon size="18">mdi-send</v-icon>
                </v-btn>
            </div>
        </v-sheet>
    </div>
</template>

<script>
import EmojiButton from "../emoji-button";
import Editor from "./ck-editor.vue";
import Giphy from "../giphy/giphy.vue";

// Editor
import MyEnter from "./plugins/enter";
import MyMention from "./plugins/mention";
import ClassicEditor from "./ck-editor.js";
import plainTextToHtml from "@ckeditor/ckeditor5-clipboard/src/utils/plaintexttohtml";
import normalizeclipboarddata from "@ckeditor/ckeditor5-clipboard/src/utils/normalizeclipboarddata";

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
    components: { EmojiButton, Editor, Giphy },
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
        onSelectGif(gif) {
            if (gif.images && gif.images.original && gif.images.original.url) {
                let alt = "";
                let author = "";
                if (gif.title) {
                    const titleArr = gif.title.split("GIF");
                    alt = (titleArr[0] && titleArr[0].trim()) || "gif";
                    author =
                        titleArr.length > 1 && titleArr[1]
                            ? titleArr[1].trim()
                            : "giphy";
                }

                let imageEl = `<img id="gif-${gif.id}" class="image image-gif" alt="${alt}"  data-author="${author}" `;
                imageEl += `src="${gif.images.downsized_medium.url}" data-original-src="${gif.images.original.url}" data-preview-src="${gif.images.preview_gif.url}"></img>`;
                const figureEl = `<figure class="image gif">${imageEl}</figure>`;
                this.$emit("send", figureEl);
            }
        },
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

            // Handle clipboard input
            this.clipboardPlugin = this.editorInstance.plugins.get("Clipboard");
            this.editorInstance.editing.view.document.on(
                "clipboardInput",
                this.formatClipboardData
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
        formatClipboardData(evt, data) {
            const clipboardPlugin = this.clipboardPlugin;
            const htmlProcessor = clipboardPlugin._htmlDataProcessor;
            const dataTransfer = data.dataTransfer;
            let content = dataTransfer.getData("text/html");
            if (content) {
                content = this.reformatHtml(content);
            } else {
                content = dataTransfer.getData("text/plain");
                if (content) {
                    content = plainTextToHtml(content);
                }
            }

            const viewContent = htmlProcessor.toView(content);

            // Just like the clipboard feature, trigger the inputTransformation event
            // to allow further processing of the content.
            clipboardPlugin.fire("inputTransformation", {
                content: viewContent,
                dataTransfer,
            });

            this.editorInstance.editing.view.scrollToTheSelection();
            evt.stop();
        },
        reformatHtml(html) {
            let content = normalizeclipboarddata(html)
                .replace(/<.?html.*>/g, "")
                .replace(/<(body|\/body).*>/g, "");
            const rootEl = document.createElement("div");
            rootEl.innerHTML = content;

            // Reset color and background
            rootEl.children.forEach(el => {
                el.style.color = "";
                el.style.backgroundColor = "";
            });

            // Format table
            const tableEls = rootEl.getElementsByTagName("table");
            if (tableEls && tableEls.length > 0) {
                tableEls.forEach(tableEl => {
                    // Update table's width
                    tableEl.style.width = "auto";
                    tableEl.style.maxWidth = "100%";
                });
            }

            return rootEl.innerHTML;
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

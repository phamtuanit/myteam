<template>
    <ckeditor
        v-if="showEditor"
        :editor="editor"
        v-model="internalValue"
        :config="editorConfig"
        ref="editor"
        @ready="onEditorReady"
    ></ckeditor>
</template>

<script>
import CKEditor from "@ckeditor/ckeditor5-vue";
import ClassicEditor from "./ck-editor.js";

export default {
    props: {
        value: {
            type: String,
            default: "",
        },
        showToolBar: {
            type: Boolean,
            default: true,
        },
        classEditor: {
            type: Function,
            default: ClassicEditor,
        },
    },
    components: {
        // Use the <ckeditor> component in this view.
        ckeditor: CKEditor.component,
    },
    data() {
        this.config = require("../../conf/system.json");
        return {
            fileRepository: null,
            showEditor: false,
            editor: this.classEditor,
            internalValue: this.value,
            editorConfig: {
                simpleUpload: {
                    // The URL that the images are uploaded to.
                    uploadUrl: this.config.media.url,

                    // Headers sent along with the XMLHttpRequest to the upload server.
                    headers: {},
                },
            },
        };
    },
    watch: {
        showToolBar() {
            this.updateTopbar();
        },
        internalValue() {
            this.$emit("input", this.internalValue);
        },
        value(val) {
            if (this.internalValue !== val) {
                this.internalValue = val;
            }
        },
    },
    mounted() {
        setTimeout(() => {
            // Display editor
            this.showEditor = true;
        }, 5);

        this.auth = window.IoC.get("auth");

        if (this.auth) {
            this.auth
                .getToken()
                .then(token => {
                    this.editorConfig.simpleUpload.headers[
                        "Authorization"
                    ] = token;
                })
                .catch(console.warn);
        }
    },
    methods: {
        updateTopbar() {
            const toolbar = this.editorInstance.ui.view.toolbar.element;

            if (this.showToolBar == true) {
                toolbar.classList.remove("ck-editor__top-hide");
            } else {
                toolbar.classList.add("ck-editor__top-hide");
            }
        },
        onEditorReady() {
            this.editorInstance = this.$refs.editor.instance;
            this.updateTopbar();
            this.$emit("ready", this.editorInstance);
            // this.fileRepository = this.editorInstance.plugins.get( FileRepository );
        },
    },
};
</script>

<style lang="css">
@import "../../assets/ckeditor.css";

.ck.ck-content.ck-editor__editable {
    overflow-wrap: break-word;
    word-break: break-all;
}
</style>

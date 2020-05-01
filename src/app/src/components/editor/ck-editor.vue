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
        config: {
            type: Object,
            default: () => ({}),
        },
    },
    components: {
        // Use the <ckeditor> component in this view.
        ckeditor: CKEditor.component,
    },
    data() {
        const editorConfig = { ...this.config };
        return {
            showEditor: false,
            editor: this.classEditor,
            internalValue: this.value,
            editorConfig: editorConfig,
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
    created() {
        const simpleUpload = this.editorConfig.simpleUpload;
        if (
            simpleUpload &&
            (!simpleUpload.headers || !simpleUpload.headers["Authorization"])
        ) {
            !simpleUpload.headers && (simpleUpload.headers = {});
            this.auth = window.IoC.get("auth");
            if (this.auth) {
                this.auth
                    .getToken()
                    .then(token => {
                        simpleUpload.headers["Authorization"] = token;
                    })
                    .catch(console.warn);
            }
        }

        if (simpleUpload && !simpleUpload.uploadUrl) {
            const config = require("../../conf/system.json");
            simpleUpload.uploadUrl = config.attachment.url;

            if (simpleUpload.id) {
                simpleUpload.uploadUrl += `?sub=${simpleUpload.id}`;
            }
        }
    },
    mounted() {
        setTimeout(() => {
            // Display editor
            this.showEditor = true;
        }, 5);
    },
    methods: {
        updateTopbar() {
            const toolbar = this.editorInstance.ui.view.toolbar.element;

            if (this.showToolBar == true) {
                toolbar.classList.remove("ck-editor__top-hiden");
            } else {
                toolbar.classList.add("ck-editor__top-hiden");
            }
        },
        onEditorReady() {
            this.editorInstance = this.$refs.editor.instance;
            this.updateTopbar();

            // this.editorInstance.execute("tableWidth", {
            //     value: "100%",
            // });

            this.$emit("ready", this.editorInstance);
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

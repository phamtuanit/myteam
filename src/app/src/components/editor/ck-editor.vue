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
        const editorConfig = this.config;
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
            const baseUrl =
                config.env == "prd"
                    ? window.location.origin
                    : config.server.address;
            simpleUpload.uploadUrl = baseUrl + config.attachment.url;

            if (simpleUpload.id) {
                simpleUpload.uploadUrl += `?sub=${simpleUpload.id}`;
            }
        }
    },
    mounted() {
        setTimeout(() => {
            // Display editor
            this.showEditor = true;
        }, 20);
    },
    methods: {
        updateTopbar() {
            const view = this.editorInstance.ui.view;

            if (this.showToolBar == true) {
                view.element.dataset.size = "full";
            } else {
                view.element.dataset.size = "mini";
            }
        },
        onEditorReady() {
            this.editorInstance = this.$refs.editor.$_instance;
            this.updateTopbar();
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

.ck.ck-editor[data-size="mini"] .ck.ck-toolbar.ck-toolbar_grouping {
    display: none;
}

.ck.ck-editor[data-size="mini"] .ck-editor__editable.ck-rounded-corners {
    border-radius: var(--ck-border-radius) !important;
}
</style>

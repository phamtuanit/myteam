<template>
  <ckeditor
    v-if="showEditor"
    :editor="editor"
    v-model="value"
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
        showToolBar: {
            type: Boolean,
            default: true,
        },
        height: {
            type: Number,
            default: -1,
        },
        maxHeight: {
            type: Number,
            default: -1,
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
        return {
            showEditor: false,
            editor: this.classEditor,
            value: "<p>Content of the editor.</p>",
            editorConfig: {},
        };
    },
    watch: {
        showToolBar(val) {
            this.updateTopbar();
        },
    },
    created() {},
    mounted() {
        setTimeout(() => {
            // Display editor
            this.showEditor = true;
        }, 50);
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
        setupEditor() {
            const editable = this.editorInstance.ui.view.editable.element;
            // ui.view.editable.editableElement.style.height = '300px';
            if (this.height > 0) {
                // editable.
            }
        },
        onEditorReady() {
            this.editorInstance = this.$refs.editor.instance;
            this.updateTopbar();
            this.setupEditor();
            this.$emit("ready", this.editorInstance);
        },
    },
};
</script>

<style lang="css">
@import "../../assets/ckeditor.css";
</style>


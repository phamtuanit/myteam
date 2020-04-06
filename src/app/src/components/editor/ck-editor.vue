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
            internalValue: this.value,
            editorConfig: {},
        };
    },
    watch: {
        showToolBar() {
            this.updateTopbar();
        },
        internalValue() {
            this.$emit("input", this.internalValue);
        }
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
        onEditorReady() {
            this.editorInstance = this.$refs.editor.instance;
            this.updateTopbar();
            this.$emit("ready", this.editorInstance);
        },
    },
};
</script>

<style lang="css">
@import "../../assets/ckeditor.css";
</style>


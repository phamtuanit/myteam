<template>
    <v-sheet min-height="60" class="text-editor-container">
        <ckeditor
            :editor="editor"
            v-model="value"
            :config="editorConfig"
        ></ckeditor>
    </v-sheet>
</template>

<script>
import CKEditor from "@ckeditor/ckeditor5-vue";
import ClassicEditor from "./editor.js";

export default {
    components: {
        // Use the <ckeditor> component in this view.
        ckeditor: CKEditor.component,
    },
    data() {
        return {
            editor: ClassicEditor,
            value: "<p>Content of the editor.</p>",
            editorConfig: {
            },
        };
    },
    created() {},
};
</script>

<style>
.ck.ck-editor__main>.ck-editor__editable {
    max-height: 200px;
}
</style>

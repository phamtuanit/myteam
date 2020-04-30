import Plugin from "@ckeditor/ckeditor5-core/src/plugin";
import EnterCommand from "@ckeditor/ckeditor5-enter/src/entercommand";
import EnterObserver from "@ckeditor/ckeditor5-enter/src/enterobserver";

export default class MyEnter extends Plugin {
    static get pluginName() {
        return "MyEnter";
    }

    init() {
        const editor = this.editor;
        const view = editor.editing.view;
        const viewDocument = view.document;

        view.addObserver(EnterObserver);

        editor.commands.add("enter", new EnterCommand(editor));
        this.listenTo(
            viewDocument,
            "enter",
            (evt, data) => {
                if (!this.isEnabled) {
                    return;
                }
                data.preventDefault();

                // The soft enter key is handled by the ShiftEnter plugin.
                if (data.isSoft) {
                    return;
                }

                editor.execute("enter");
                view.scrollToTheSelection();
            },
            { priority: "low" }
        );
    }
}

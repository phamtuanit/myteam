/**
 * @license Copyright (c) 2014-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
// https://ckeditor.com/ckeditor-5/online-builder/
import ClassicEditor from "@ckeditor/ckeditor5-editor-classic/src/classiceditor.js";

import BlockQuote from "@ckeditor/ckeditor5-block-quote/src/blockquote.js";
import Bold from "@ckeditor/ckeditor5-basic-styles/src/bold.js";
import Italic from "@ckeditor/ckeditor5-basic-styles/src/italic.js";
import List from "@ckeditor/ckeditor5-list/src/list.js";
import PasteFromOffice from "@ckeditor/ckeditor5-paste-from-office/src/pastefromoffice";
// import Table from "@ckeditor/ckeditor5-table/src/table.js";
// import TableToolbar from "@ckeditor/ckeditor5-table/src/tabletoolbar.js";
// import TableCellProperties from "@ckeditor/ckeditor5-table/src/tablecellproperties";
// import TableProperties from "@ckeditor/ckeditor5-table/src/tableproperties";
import Code from "@ckeditor/ckeditor5-basic-styles/src/code.js";
import CodeBlock from "@ckeditor/ckeditor5-code-block/src/codeblock.js";
import FontBackgroundColor from "@ckeditor/ckeditor5-font/src/fontbackgroundcolor.js";
import FontColor from "@ckeditor/ckeditor5-font/src/fontcolor.js";
import Indent from "@ckeditor/ckeditor5-indent/src/indent.js";
// import TodoList from "@ckeditor/ckeditor5-list/src/todolist";
import IndentBlock from "@ckeditor/ckeditor5-indent/src/indentblock.js";
// import Mention from "@ckeditor/ckeditor5-mention/src/mention.js";
import Strikethrough from "@ckeditor/ckeditor5-basic-styles/src/strikethrough.js";
import Underline from "@ckeditor/ckeditor5-basic-styles/src/underline.js";
// import SpecialCharactersEssentials from "@ckeditor/ckeditor5-special-characters/src/specialcharactersessentials.js";
// import SpecialCharacters from "@ckeditor/ckeditor5-special-characters/src/specialcharacters.js";
// import Essentials from "@ckeditor/ckeditor5-essentials/src/essentials.js";
import Paragraph from "@ckeditor/ckeditor5-paragraph/src/paragraph.js";
import TextTransformation from "@ckeditor/ckeditor5-typing/src/texttransformation";

// Essentials plugin
import Clipboard from '@ckeditor/ckeditor5-clipboard/src/clipboard';
import Enter from '@ckeditor/ckeditor5-enter/src/enter';
import ShiftEnter from '@ckeditor/ckeditor5-enter/src/shiftenter';
import Typing from '@ckeditor/ckeditor5-typing/src/typing';
import Undo from '@ckeditor/ckeditor5-undo/src/undo';

export default class Editor extends ClassicEditor { }

// Plugins to include in the build.
Editor.builtinPlugins = [
    Clipboard,
    Enter,
    ShiftEnter,
    Typing,
    Undo,
    BlockQuote,
    Bold,
    Italic,
    List,
    PasteFromOffice,
    // Table,
    // TableToolbar,
    // TableProperties,
    // TableCellProperties,
    Code,
    CodeBlock,
    FontBackgroundColor,
    FontColor,
    Indent,
    // TodoList,
    IndentBlock,
    // Mention,
    Strikethrough,
    Underline,
    // SpecialCharactersEssentials,
    // SpecialCharacters,
    // Essentials,
    Paragraph,
    TextTransformation,
];

// Editor configuration.
ClassicEditor.defaultConfig = {
    toolbar: {
        items: [
            "bold",
            "italic",
            "strikethrough",
            "underline",
            "|",
            "bulletedList",
            "numberedList",
            // "todoList",
            "|",
            "fontBackgroundColor",
            "fontColor",
            "|",
            "blockQuote",
            "indent",
            "outdent",
            // "specialCharacters",
            // "|",
            "code",
            "codeBlock",
            // "insertTable",
        ],
    },
    language: "en",
    // table: {
    //     contentToolbar: [
    //         "tableColumn",
    //         "tableRow",
    //         "mergeTableCells",
    //         "tableProperties",
    //         "tableCellProperties",
    //     ],
    // },
    typing: {
        transformations: {
            extra: [
                // Add some custom transformations – e.g. for emojis.
                { from: ":):", to: "🙂" },
                { from: ":+1:", to: "👍" },
                { from: ":tada:", to: "🎉" },
            ],
            remove: [
                "quotesPrimary",
                "quotesSecondary",
                "quotesPrimaryEnGb",
                "quotesPrimaryPl",
                "quotesSecondaryPl",
            ],
        },
    },
};

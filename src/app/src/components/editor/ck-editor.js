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
// import PasteFromOffice from "@ckeditor/ckeditor5-paste-from-office/src/pastefromoffice";
import Table from "@ckeditor/ckeditor5-table/src/table.js";
import TableToolbar from "@ckeditor/ckeditor5-table/src/tabletoolbar.js";
import TableCellProperties from "@ckeditor/ckeditor5-table/src/tablecellproperties";
import TableProperties from "@ckeditor/ckeditor5-table/src/tableproperties";
import Code from "@ckeditor/ckeditor5-basic-styles/src/code.js";
import CodeBlock from "@ckeditor/ckeditor5-code-block/src/codeblock.js";
import FontBackgroundColor from "@ckeditor/ckeditor5-font/src/fontbackgroundcolor.js";
import FontColor from "@ckeditor/ckeditor5-font/src/fontcolor.js";
import Indent from "@ckeditor/ckeditor5-indent/src/indent.js";
import TodoList from "@ckeditor/ckeditor5-list/src/todolist";
import IndentBlock from "@ckeditor/ckeditor5-indent/src/indentblock.js";
import Mention from "@ckeditor/ckeditor5-mention/src/mention.js";
import Strikethrough from "@ckeditor/ckeditor5-basic-styles/src/strikethrough.js";
import Underline from "@ckeditor/ckeditor5-basic-styles/src/underline.js";
import Paragraph from "@ckeditor/ckeditor5-paragraph/src/paragraph.js";
import TextTransformation from "@ckeditor/ckeditor5-typing/src/texttransformation";

// Essentials plugin
import Clipboard from "@ckeditor/ckeditor5-clipboard/src/clipboard";
import ShiftEnter from "@ckeditor/ckeditor5-enter/src/shiftenter";
// import Enter from '@ckeditor/ckeditor5-enter/src/enter';
import Typing from "@ckeditor/ckeditor5-typing/src/typing";
import Undo from "@ckeditor/ckeditor5-undo/src/undo";

// Images: https://ckeditor.com/docs/ckeditor5/latest/features/image.html
import Image from '@ckeditor/ckeditor5-image/src/image';
import ImageToolbar from '@ckeditor/ckeditor5-image/src/imagetoolbar';
import ImageStyle from '@ckeditor/ckeditor5-image/src/imagestyle';
import ImageResize from '@ckeditor/ckeditor5-image/src/imageresize';
import ImageUpload from '@ckeditor/ckeditor5-image/src/imageupload';
import SimpleUploadAdapter from "@ckeditor/ckeditor5-upload/src/adapters/simpleuploadadapter";

import Link from '@ckeditor/ckeditor5-link/src/link';
import AutoLink from './plugins/autolink';
import MediaEmbed from '@ckeditor/ckeditor5-media-embed/src/mediaembed';

export default class Editor extends ClassicEditor { }

// Plugins to include in the build.
Editor.builtinPlugins = [
    Link,
    AutoLink,
    Image,
    ImageToolbar,
    ImageStyle,
    ImageResize,
    ImageUpload,
    SimpleUploadAdapter,
    Clipboard,
    ShiftEnter,
    Typing,
    Undo,
    BlockQuote,
    Bold,
    Italic,
    List,
    // PasteFromOffice, // to fix table's width when pasting
    Table,
    TableToolbar,
    TableProperties,
    TableCellProperties,
    Code,
    CodeBlock,
    FontBackgroundColor,
    FontColor,
    Indent,
    TodoList,
    IndentBlock,
    Mention,
    Strikethrough,
    Underline,
    Paragraph,
    TextTransformation,
    MediaEmbed,
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
            "todoList",
            "|",
            "indent",
            "outdent",
            "|",
            "blockQuote",
            "fontBackgroundColor",
            "fontColor",
            "|",
            'link',
            "imageUpload",
            "mediaEmbed",
            // "imageStyle:alignLeft",
            // "imageStyle:full",
            // "imageStyle:alignRight",
            // "|",
            // "specialCharacters",
            // "|",
            "insertTable",
            "code",
            "codeBlock",
        ],
    },
    language: "en",
    table: {
        contentToolbar: [
            "tableColumn",
            "tableRow",
            "mergeTableCells",
            "tableProperties",
            "tableCellProperties",
        ],
        tableProperties: {
            tableWidth: "1000px",
        },
        tableCellProperties: {
        }
    },
    typing: {
        transformations: {
            extra: [
                // Add some custom transformations – e.g. for emojis.
                { from: ":)", to: "🙂" },
                { from: ":D", to: "😀" },
                { from: ":(", to: "😂" },
                { from: "<3", to: "😍" },
                { from: ":x", to: "☠" },
                { from: ":tada", to: "🎉" },
                { from: ":*", to: "🌸" },
                { from: "zzz", to: "💤" },
                { from: ":+1", to: "👍" },
                { from: ":like", to: "👍" },
                { from: "8=>", to: "🖕" },
                { from: "())", to: "🍑" },
                { from: "|^", to: "↑" },
                { from: "|v", to: "↓" },
                { from: "=>", to: "⇒" },
                { from: ":dot", to: "⋅" },
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
    image: {
        // You need to configure the image toolbar, too, so it uses the new style buttons.
        toolbar: [
            "imageStyle:alignLeft",
            "imageStyle:full",
            "imageStyle:alignRight",
        ],

        styles: [
            // This option is equal to a situation where no style is applied.
            "full",

            // This represents an image aligned to the left.
            "alignLeft",

            // This represents an image aligned to the right.
            "alignRight",
        ],
    },
    link: {
        // Automatically add target="_blank" and rel="noopener noreferrer" to all external links.
        addTargetToExternalLinks: true,
    },
    mediaEmbed: {
        previewsInData: true
    }
};

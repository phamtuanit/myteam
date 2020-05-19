const Base = require("../processor-base.js");
const reText = require("retext");
const emoji = require("retext-emoji");
const emojiEncoder = reText().use(emoji, { convert: "encode" });

const unified = require("unified");
const htmlParse = require("rehype-parse");
const htmlCompiler = require("rehype-stringify");
const htmlProcessor = unified().use(htmlCompiler);
const htmlParser = unified().use(htmlParse);

module.exports = class EmojiEncoder extends Base {
    constructor(logger) {
        super(logger, "EmojiEncoder");
    }

    process(message, operation) {
        message = super.process(message, operation);

        const htmlTree = htmlParser.parse(message.body.content);
        // Convert Code to Emoji
        const bodyNode = encodeEmoji(htmlTree.children[0].children[1]);

        // Convert Hml tree to string
        if (bodyNode && bodyNode.children && bodyNode.children.length > 0) {
            let newHtml = "";
            bodyNode.children.forEach((node) => {
                // Clean empty element
                const hasData =
                    node.type !== "text" &&
                    node.children &&
                    node.children.length > 0 &&
                    node.children.filter((chNode) => {
                        return chNode.type == "text" &&
                            chNode.value.trim() == ""
                            ? false
                            : true;
                    }).length > 0;

                if (hasData) {
                    newHtml += htmlProcessor.stringify(node);
                }
            });

            if (newHtml) {
                message.body.content = newHtml;
            }
        }
        return message;
    }
};

function encodeEmoji(htmlNode) {
    if (htmlNode && htmlNode.type === "text" && htmlNode.value) {
        htmlNode.value = emojiEncoder.processSync(htmlNode.value).contents;
        return htmlNode;
    }

    const excludeTags = ["pre", "code", "blockquote"];
    if (
        htmlNode &&
        !excludeTags.includes(htmlNode.tagName) &&
        htmlNode.children &&
        htmlNode.children.length > 0
    ) {
        htmlNode.children.forEach(encodeEmoji);
    }

    return htmlNode;
}

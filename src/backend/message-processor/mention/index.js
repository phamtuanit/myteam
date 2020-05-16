const Base = require("../processor-base.js");

const MENTION_REGEX = /<.*data-mention="@\w+.*".*data-user-id="\w+.*">/gm;
const USER_ID_REGEX = /data-user-id="\w.*"/gm;
module.exports = class Mention extends Base {
    constructor(logger) {
        super(logger, "Mention");
    }

    process(message, operation) {
        message = super.process(message, operation);
        const content = message.body.content;
        const mentions = this.getMentions(content);
        message.mentions = mentions || [];
        return message;
    }

    getMentions(html) {
        html = html.replace(/>/g, ">\n");
        const matchedEls = html.match(MENTION_REGEX);
        if (matchedEls && matchedEls.length > 0) {
            const mentions = {};
            matchedEls.forEach((mentionEl) => {
                const matchedUserIds = mentionEl.match(USER_ID_REGEX);
                if (matchedUserIds && matchedUserIds.length > 0) {
                    const userIdData = matchedUserIds[0];
                    const userId = userIdData
                        .replace(/data-user-id=/g, "")
                        .replace(/"/g, "");
                    mentions[userId] = mentionEl;
                }
            });

            let users = Object.keys(mentions);
            const hasAllUsers = users.includes("all-users");
            if (hasAllUsers === true) {
                users = ["all-users"];
            }

            return users.length > 0 ? users : null;
        }

        return null;
    }
};

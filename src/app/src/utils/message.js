export const getMessageText = function getMessageText(message, defaultText = "", length = 255) {
    if (!message) {
        return defaultText;
    }

    const msgType = message.body.type || "html";
    switch (msgType) {
        case "html":
            {
                const html = message.body.content.replace(/<img/g, '<span').replace(/<\/img/g, '</span');
                const el = document.createElement("div");
                el.innerHTML = html;
                return truncateString(el.innerText.trim(), length) || "(Media content)";
            }

        default:
            return defaultText;
    }
}

export const truncateString = function truncateString(str, num) {
    if (str.length <= num) {
        return str
    }
    return str.slice(0, num) + '...';
}
function htmlEncoder(html) {
    if (!html) {
        return html;
    }

    return String(html)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function htmlDecoder(str) {
    if (!str) {
        return str;
    }
    return (
        String(str)
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            // eslint-disable-next-line quotes
            .replace(/&quot;/g, '"')
    );
}

module.exports = {
    htmlEncoder,
    htmlDecoder,
};

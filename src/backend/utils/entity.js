function cleanDbMark(entity) {
    if (entity) {
        const clean = function clean(el) {
            Object.keys(el).forEach((key) => {
                if (key.startsWith("_")) {
                    delete el[key];
                }
            });
        };

        if (Array.isArray(entity)) {
            entity.forEach(clean);
        } else {
            clean(entity);
        }
    }
    return entity;
}

function hasCode(string) {
    if (!string) {
        return "";
    }
    const buf = Buffer.from(string, "utf8");
    return buf.toString("hex");
}

module.exports = {
    cleanDbMark,
    hasCode,
};

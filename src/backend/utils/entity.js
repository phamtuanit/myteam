module.exports.cleanDbMark = function cleanDbMark(entify) {
    if (entify) {
        Object.keys(entify).forEach(key => {
            if (key.startsWith("_")) {
                delete entify[key];
            }
        });
    }
    return entify;
}
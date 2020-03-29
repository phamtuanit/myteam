module.exports.cleanDbMark = function cleanDbMark(entity) {
    if (entity) {
        function clean(el) {
            Object.keys(el).forEach(key => {
                if (key.startsWith("_")) {
                    delete el[key];
                }
            });
        }
        if (Array.isArray(entity)) {
            entity.forEach(clean);
        } else {
            clean(entity);
        }
    }
    return entity;
}
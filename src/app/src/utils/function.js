export function debounce(func, wait) {
    let timeout;

    return function() {
        let context = this;
        let args = arguments;

        const executeFunction = function() {
            func.apply(context, args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(executeFunction, wait);
    };
}

export const fillHeight = function (element, marginBottom, parentElement) {
    let targetEls = [];
    if (typeof element === "string") {
        targetEls = Array.from(parentElement.getElementsByClassName(element));
    } else if (Array.isArray(element) || element.length != undefined) {
        targetEls = Array.from(element);
    } else if (typeof element === "object") {
        targetEls = [element];
    } else {
        return;
    }

    if (targetEls.length > 0) {
        let result = [];
        targetEls.forEach((targetEl) => {
            const targetRect = targetEl.getBoundingClientRect();
            let calHeight = targetRect.top + marginBottom;
            targetEl.style.height = `calc(100vh - ${calHeight}px)`;
            result.push(window.innerHeight - calHeight);
        });
        if (result.length > 1) {
            return result;
        }
        return result.length > 0 ? result[0] : undefined;
    }
};

export const scrollToBottom = (el, smooth = true) => {
    if (typeof el.scroll === "function") {
        el.scroll({
            top: el.scrollHeight,
            behavior: smooth ? "smooth" : "instant",
        });
    } else {
        el.scrollTop = el.scrollHeight;
    }
};

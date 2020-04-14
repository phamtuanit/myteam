const scrollToBottom = (el, smooth) => {
    setTimeout(() => {
        if (typeof el.scroll === "function") {
            el.scroll({
                top: el.scrollHeight,
                behavior: smooth ? "smooth" : "instant",
            });
        } else {
            el.scrollTop = el.scrollHeight;
        }
    }, 0);
};

export default {
    bind: (el, binding) => {
        let scrolled = false;

        el.addEventListener("scroll", () => {
            scrolled = el.scrollTop + el.clientHeight + 1 < el.scrollHeight;
        });

        new MutationObserver(e => {
            let config = binding.value || {};
            let pause = config.always === false && scrolled;
            const addedNodes = e[e.length - 1].addedNodes.length;
            const removedNodes = e[e.length - 1].removedNodes.length;

            if (config.scrollonremoved) {
                if (pause || (addedNodes != 1 && removedNodes != 1)) return;
            } else {
                if (pause || addedNodes != 1) return;
            }

            let smooth = config.smooth;
            const loadingRemoved = !addedNodes && removedNodes === 1;
            if (
                loadingRemoved &&
                config.scrollonremoved &&
                "smoothonremoved" in config
            ) {
                smooth = config.smoothonremoved;
            }
            scrollToBottom(el, smooth);
        }).observe(el, { childList: true, subtree: true });
    },
    inserted: (el, binding) => {
        const config = binding.value || {};
        scrollToBottom(el, config.smooth);
    },
};

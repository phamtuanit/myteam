export default {
    props: {
        message: {
            type: Object,
            default: () => ({}),
        },
    },
    data() {
        return {};
    },
    watch: {
        "message.body.content"() {
            this.$nextTick(this.supportZoomImage);
        },
        "message.body.html"() {
            this.$nextTick(this.supportZoomImage);
        },
    },
    mounted() {
        this.$nextTick(this.supportZoomImage);
    },
    beforeDestroy() {
        const imgEls = this.$el.getElementsByTagName("img");
        imgEls.forEach(img => {
            delete img.onclick;
        });
    },
    methods: {
        supportZoomImage() {
            // Get the modal
            const modal = document.body.getElementsByClassName("image-modal")[0];
            const modalContent = modal.getElementsByClassName("image-modal_content")[0];
            const containerEl = this.$el;
            const imgEls = containerEl.getElementsByTagName("img");
            imgEls.forEach(img => {
                img.onclick = function() {
                    modal.style.display = "flex";
                    modalContent.src = this.dataset.originalSrc || this.src;
                };
            });
        },
    },
};

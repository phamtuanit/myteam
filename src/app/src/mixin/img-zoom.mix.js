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
        }
    },
    mounted() {
        this.$nextTick(this.supportZoomImage);
    },
    methods: {
        supportZoomImage() {
            // Get the modal
            const modal = document.body.getElementsByClassName(
                "image-modal"
            )[0];
            const modalContent = modal.getElementsByClassName(
                "image-modal_content"
            )[0];
            const containerEl = this.$el;
            const imgEls = containerEl.getElementsByTagName("img");
            imgEls.forEach(img => {
                img.onclick = function () {
                    modal.style.display = "flex";
                    modalContent.src = this.dataset.originalSrc || this.src;
                };
            });

            // Get the <span> element that closes the modal
            const closeBtn = modal.getElementsByClassName(
                "image-modal_close"
            )[0];

            // When the user clicks on <span> (x), close the modal
            closeBtn.onclick = function () {
                modal.style.display = "none";
            };
        }
    },
};

import { toTimeAgo } from "../utils/date.js";
const IMAGE_ZOOM_MODAL_TEMPLATE = `
        <div class="image-modal">
            <!-- The Close Button -->
            <span class="image-modal_close">&times;</span>

            <!-- Modal Content (The Image) -->
            <img class="image-modal_content"/>
        </div>
`;
export default {
    props: {
        message: {
            type: Object,
            default: () => ({}),
        },
    },
    data() {
        return {
            timeAgo: null,
        };
    },
    created() {
        this.updatedUIMix();
        this.timer = setInterval(this.updatedUIMix, 60 * 1000);
        this.setupZoomModal();
    },
    mounted() {
        this.$nextTick(this.supportZoomImage);
    },
    destroyed() {
        clearInterval(this.timer);
    },
    methods: {
        updatedUIMix() {
            // TODO: will remove arrivalTime
            this.timeAgo = toTimeAgo(this.message.created || this.message.arrivalTime);
        },
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
                    modalContent.src = this.src;
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
        },
        setupZoomModal() {
            const modals = document.body.getElementsByClassName("image-modal");
            if (modals.length <= 0) {
                const el = document.createElement("div");
                el.innerHTML = IMAGE_ZOOM_MODAL_TEMPLATE;
                const modal = el.firstElementChild;
                document.body.appendChild(modal);

                document.body.addEventListener("keyup", function (e) {
                    if (
                        (e.key === "Escape" || e.keyCode == 27) &&
                        modal.style.display &&
                        modal.style.display !== "none"
                    ) {
                        modal.style.display = "none";
                        e.stopPropagation();
                    }
                });
            }
        },
    },
};

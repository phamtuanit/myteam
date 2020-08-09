import { toTimeAgo } from "../utils/date.js";
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
    },
    mounted() {
        this.timer = setInterval(this.updatedUIMix, 60 * 1000);
    },
    destroyed() {
        clearInterval(this.timer);
    },
    methods: {
        updatedUIMix() {
            // TODO: will remove arrivalTime
            this.timeAgo = toTimeAgo(this.message.created || this.message.arrivalTime);
        },
    },
};

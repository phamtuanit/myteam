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
            timeAgo: "",
        };
    },
    mounted() {
        this.timer = setInterval(this.updatedUIMix, 60 * 1000);
        this.updatedUIMix();
    },
    destroyed() {
        clearInterval(this.timer);
    },
    methods: {
        updatedUIMix() {
            const time = this.message.created || this.message.arrivalTime;
            const date = new Date(time);
            if (Date.now() - date.getTime() > (4 * 3600000)) { // 4 hours ago
                clearTimeout(this.timer);
                this.timeAgo = this.getSimpleTime(date);
                return;
            }
            this.timeAgo = toTimeAgo(time);
        },
        getSimpleTime(date) {
            if (date) {
                const day = new Date(date);
                return (
                    day.toLocaleDateString() +
                    " " +
                    day.getHours() +
                    ":" +
                    day.getMinutes()
                );
            }

            return "N/A";
        },
    },
};

import Axios from "axios";
const Service = function service() {
    this.name = "messages/";
};

Service.prototype.post = function (convId, rawBody, type) {
    if (typeof convId == "number" && (typeof rawBody == "object" || typeof rawBody == "string")) {
        const msg = {
            body: {
                type: type || "html",
                content: typeof rawBody == "object" ? rawBody : { html: rawBody },
            },
        };
        console.info(`Posting new message to [${convId}]`);
        return Axios.post(this.name + `?conversation=${convId}`, msg);
    }
    return Promise.reject("Data is invalid");
};

Service.prototype.update = function (convId, msg) {
    if (typeof convId == "number" && msg != null && typeof msg == "object" && typeof msg.id == "number") {
        console.info(`Updating message ${convId}/${msg.id}`);
        return Axios.put(this.name + msg.id + `?conversation=${convId}`, msg);
    }
    return Promise.reject("Data is invalid");
};

Service.prototype.delete = function (convId, msgId) {
    if (typeof convId == "number" && typeof msgId == "number") {
        console.info(`Deleting message ${convId}/${msgId}`);
        return Axios.delete(this.name + msgId + `?conversation=${convId}`);
    }
    return Promise.reject("Data is invalid");
};

export default Service;

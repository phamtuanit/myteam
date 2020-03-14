import Axios from "axios";
const Service = function service() {
    this.name = "conversations";
    this.freshMessage;
};

Service.prototype.getServiceName = function getServiceName(verb) {
    let name = this.name;
    switch (verb) {
        case "get":
        case "delete":
            name = "histories";
            break;
    }
    return name + "/";
};

Service.prototype.post = function(convId, rawBody, type) {
    if (typeof rawBody == "object" || typeof rawBody == "string") {
        const msg = {
            body: {
                type: type || "html",
                content: typeof rawBody == "object" ? rawBody : { html: rawBody },
            },
        };
        convId = typeof convId == "number" ? convId : "";
        console.info(`Posting new message to [${convId}]`);
        return Axios.post(this.getServiceName("post") + convId, msg);
    }
    return Promise.reject("Data is invalid");
};

Service.prototype.update = function(convId, msg) {
    if (typeof convId == "number" && msg != null && typeof msg == "object" && typeof msg.id == "number") {
        console.info(`Updating message ${convId}/${msg.id}`);
        return Axios.put(this.getServiceName("put") + convId, msg);
    }
    return Promise.reject("Data is invalid");
};

Service.prototype.delete = function(convId, msgId) {
    if (typeof convId == "number" && typeof msgId == "number") {
        console.info(`Deleting message ${convId}/${msgId}`);
        return Axios.delete(this.getServiceName("delete") + convId + "/" + msgId);
    }
    return Promise.reject("Data is invalid");
};

export default Service;

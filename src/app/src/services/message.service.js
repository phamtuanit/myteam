import Axios from "axios";
const Service = function service() {
    this.name = "messages/";
};
Service.prototype.get = function(convId, filter = {}) {
    if (typeof convId == "number") {
        const queries = Object.keys(filter).map(key => {
            const val = filter[key];
            if (val) {
                return `${key}=${val}`;
            }
            return null;
        });

        queries.unshift(`?conversation=${convId}`);
        const queryStr = queries.join("&");
        console.info(`Posting new message to [${convId}]`);
        return Axios.get(this.name + queryStr);
    }
    return Promise.reject("Data is invalid");
};

Service.prototype.create = function(convId, body, type = "html") {
    if (
        typeof convId == "number" &&
        (typeof body == "object" || typeof body == "string")
    ) {
        body.type = body.type || type || "html";
        const msg = {
            body,
        };
        console.info(`Posting new message to [${convId}]`);
        return Axios.post(this.name + `?conversation=${convId}`, msg);
    }
    return Promise.reject("Data is invalid");
};

Service.prototype.update = function(convId, msg) {
    if (
        typeof convId == "number" &&
        msg != null &&
        typeof msg == "object" &&
        typeof msg.id == "number"
    ) {
        console.info(`Updating message ${convId}/${msg.id}`);
        return Axios.put(this.name + msg.id + `?conversation=${convId}`, msg);
    }
    return Promise.reject("Data is invalid");
};

Service.prototype.delete = function(convId, msgId) {
    if (typeof convId == "number" && typeof msgId == "number") {
        console.info(`Deleting message ${convId}/${msgId}`);
        return Axios.delete(this.name + msgId + `?conversation=${convId}`);
    }
    return Promise.reject("Data is invalid");
};

export default Service;

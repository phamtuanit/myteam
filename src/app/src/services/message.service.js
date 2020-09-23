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
        return Axios.get(this.name + queryStr);
    }
    return Promise.reject("Data is invalid", convId, filter);
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
        return Axios.post(this.name + `?conversation=${convId}`, msg);
    }
    return Promise.reject("Data is invalid", convId, type);
};

Service.prototype.update = function(convId, id, body, type = "html") {
    if (
        typeof convId == "number" &&
        body != null &&
        typeof id == "number" &&
        typeof body == "object" &&
        body.content
    ) {
        body.type = body.type || type || "html";
        const msg = {
            body,
        };
        return Axios.put(this.name + id + `?conversation=${convId}`, msg);
    }
    return Promise.reject("Data is invalid", convId, id, type);
};

Service.prototype.react = function(convId, msgId, type, status) {
    if (
        typeof convId == "number" &&
        typeof type == "string" &&
        typeof msgId == "number" &&
        typeof status == "boolean"
    ) {
        const qr = `${type}?status=${status}&conversation=${convId}`;
        return Axios.put(this.name + msgId + `/reactions/${qr}`);
    }
    return Promise.reject("Data is invalid", convId, msgId, type, status);
};

Service.prototype.pin = function(convId, msgId, status) {
    if (
        typeof convId == "number" &&
        typeof msgId == "number" &&
        typeof status == "boolean"
    ) {
        return Axios.put(
            this.name + msgId + `/pins?status=${status}&conversation=${convId}`
        );
    }
    return Promise.reject("Data is invalid", convId, msgId, status);
};

Service.prototype.getPinned = function(convId, filter) {
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
        return Axios.get(this.name + "pins" + queryStr);
    }
    return Promise.reject("Data is invalid", convId, filter);
};

Service.prototype.delete = function(convId, msgId) {
    if (typeof convId == "number" && typeof msgId == "number") {
        return Axios.delete(this.name + msgId + `?conversation=${convId}`);
    }
    return Promise.reject("Data is invalid", convId, msgId);
};

export default Service;

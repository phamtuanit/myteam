import Axios from "axios";
const Service = function service() {
    this.name = "user-queue/";
};

Service.prototype.getAll = function (userId) {
    if (typeof userId == "string" && userId) {
        return Axios.get(this.name + userId + "/messages/");
    }
    return Promise.reject("Data is invalid");
};

Service.prototype.getById = function (userId, id) {
    if (typeof userId == "string" && userId && typeof id == "number") {
        return Axios.get(this.name + userId + "/messages/" + id);
    }
    return Promise.reject("Data is invalid");
};

Service.prototype.confirm = function (userId, ids) {
    if (typeof userId == "string" && userId && (Array.isArray(ids) || typeof ids == "number")) {
        let idQr = ids;
        if (Array.isArray(ids)) {
            idQr = ids.join(",");
        }
        return Axios.put(this.name + userId + "/messages?ids=" + idQr);
    }
    return Promise.reject("Data is invalid");
};

Service.prototype.confirmPayload = function (userId, payloadIds) {
    if (typeof userId == "string" && userId && (Array.isArray(payloadIds) || typeof payloadIds == "number")) {
        let idQr = payloadIds;
        if (Array.isArray(payloadIds)) {
            idQr = payloadIds.join(",");
        }
        return Axios.put(this.name + userId + "/messages?ids=" + idQr);
    }
    return Promise.reject("Data is invalid");
};

Service.prototype.clean = function (userId, id) {
    if (typeof userId == "string" && userId && typeof id == "number") {
        return Axios.delete(this.name + userId + "/messages/" + id);
    }
    return Promise.reject("Data is invalid");
};

export default Service;


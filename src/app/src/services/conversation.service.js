import Axios from "axios";
const Service = function service() {
    this.path = "conversations/";
};

Service.prototype.getByUser = function (userName) {
    if (typeof userName == "string" && userName) {
        return Axios.get(this.path + `?user=${userName}`);
    }
    return Promise.reject("Data is invalid");
};

Service.prototype.getAllById = function (id) {
    if (typeof id == "number") {
        return Axios.get(this.path + id);
    }
    return Promise.reject("Data is invalid");
};

Service.prototype.create = function (groupInfo) {
    if (typeof groupInfo == "object" && Array.isArray(groupInfo.subscribers)) {
        if (groupInfo.subscribers.length <= 0) {
            return Promise.reject("[subscribers] is required for new conversation");
        }
        return Axios.post(this.path, { channel: groupInfo });
    }
    return Promise.reject("Data is invalid");
};

Service.prototype.update = function (groupInfo) {
    if (typeof groupInfo == "object" && typeof groupInfo.id == "number" && Array.isArray(groupInfo.subscribers)) {
        const { id } = groupInfo;
        if (groupInfo.subscribers.length <= 0) {
            return Promise.reject("[subscribers] is required for new conversation");
        }
        return Axios.put(this.path + id, { channel: groupInfo });
    }
    return Promise.reject("Data is invalid");
};

Service.prototype.delete = function (convId) {
    if (typeof convId == "number") {
        return Axios.delete(this.path + convId);
    }
    return Promise.reject("Data is invalid");
};

Service.prototype.leave = function (convId, userId) {
    if (typeof convId == "number" && typeof userId == "string" && userId) {
        return Axios.put(this.path + convId + "/leave?user=" + userId);
    }
    return Promise.reject("Data is invalid");
};

export default Service;

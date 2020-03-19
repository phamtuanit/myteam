import Axios from "axios";
const Service = function service() {
    this.name = "conversations/";
};

Service.prototype.post = function (groupInfo) {
    if (typeof groupInfo == "object" && typeof groupInfo.name == "string" && Array.isArray(groupInfo.subscribers)) {
        if (groupInfo.subscribers.length <= 0) {
            return Promise.reject("[subscribers] is required for new conversation");
        }
        return Axios.post(this.name, { group: groupInfo });
    }
    return Promise.reject("Data is invalid");
};

Service.prototype.update = function (groupInfo) {
    if (typeof groupInfo == "object" && typeof groupInfo.id == "number" && Array.isArray(groupInfo.subscribers)) {
        const { id } = groupInfo;
        if (groupInfo.subscribers.length <= 0) {
            return Promise.reject("[subscribers] is required for new conversation");
        }
        return Axios.put(this.name + id, { group: groupInfo });
    }
    return Promise.reject("Data is invalid");
};

Service.prototype.delete = function (convId) {
    if (typeof convId == "number") {
        return Axios.delete(this.name + convId);
    }
    return Promise.reject("Data is invalid");
};

export default Service;
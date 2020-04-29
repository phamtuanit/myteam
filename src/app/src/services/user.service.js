import Axios from "axios";
const Service = function service() {
    this.path = "users/";
};

Service.prototype.getByIds = function (userIds) {
    if (Array.isArray(userIds)) {
        if (userIds.length <= 0) {
            return Promise.resolve([]);
        }
        const query = userIds.join(",");
        return Axios.get(this.path + `?user=${query}`);
    }
    return Promise.reject("Data is invalid");
};

Service.prototype.search = function (text) {
    return Axios.get(this.path + "?text=" + text);
};

Service.prototype.getAll = function (limit) {
    return Axios.get(this.path + (limit ? `?limit=${limit}` : ""));
};

export default Service;

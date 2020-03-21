import Axios from "axios";
const Service = function service() {
    this.name = "users/";
};

Service.prototype.getById = function (userId) {
    if (typeof userId == "string" && userId) {
        return Axios.get(this.name + `/${userId}`);
    }
    return Promise.reject("Data is invalid");
};

Service.prototype.getByIds = function (userIds) {
    if (Array.isArray(userIds)) {
        if (userIds.length <= 0) {
            return Promise.resolve([]);
        }
        const query = userIds.join("&user=");
        return Axios.get(this.name + `?user=${query}`);
    }
    return Promise.reject("Data is invalid");
};

export default Service;

import Axios from "axios";
const Service = function service() {
    this.name = "users/";
};

Service.prototype.getByIds = function (userIds) {
    if (Array.isArray(userIds)) {
        if (userIds.length <= 0) {
            return Promise.resolve([]);
        }
        const query = userIds.join(",");
        return Axios.get(this.name + `?user=${query}`);
    }
    return Promise.reject("Data is invalid");
};

Service.prototype.search = function (text) {
    return Axios.get(this.name + "?text=" + text);
};

export default Service;

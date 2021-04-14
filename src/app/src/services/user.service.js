import Axios from "axios";
const { buildAvatarUrl } = require("../utils/avatar");

const Service = function service() {
    this.path = "users/";
};

Service.prototype.getByIds = function (userIds) {
    if (Array.isArray(userIds)) {
        if (userIds.length <= 0) {
            return Promise.resolve([]);
        }
        const query = userIds.join(",");
        return Axios.get(this.path + `?user=${query}`).then(res => {
            updateUser(res.data);
            return res;
        });
    }
    return Promise.reject("Data is invalid");
};

Service.prototype.search = function (text) {
    return Axios.get(this.path + "?text=" + text).then(res => {
        updateUser(res.data);
        return res;
    });
};

Service.prototype.getAll = function (limit) {
    return Axios.get(this.path + (limit ? `?limit=${limit}` : "")).then(res => {
        updateUser(res.data);
        return res;
    });
};



function updateUser(users) {
    users.map(user => {
        user.avatarUrl = buildAvatarUrl(user);
        return user;
    });

    return users;
}

export default Service;

import Axios from "axios";
const Service = function service() {
    this.path = "elasticsearch/search";
};

Service.prototype.search = function(criterials) {
    if (typeof criterials === "object") {
        return Axios.post(this.path, criterials);
    }
    return Promise.reject("Data is invalid", 1, 1);
};

export default Service;

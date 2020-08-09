import Axios from "axios";
const Service = function service() {
    this.path = "elasticsearch/search";
};

Service.prototype.search = function(criterial) {
    if (typeof criterial === "object") {
        return Axios.post(this.path, criterial);
    }
    return Promise.reject("Data is invalid", 1, 1);
};

export default Service;

import axios from "axios";
import sysConfig from "../../conf/system.json";
const axiosInstance = axios.create({
    baseURL: sysConfig.env == "production" ? window.location.origin : sysConfig.server.address,
});

const Service = function() {
    this.locker = this.verifyToken();
    this.isAuthenticated = false;
};

Service.prototype = {
    async getToken() {
        await this.locker;
        const token = window.localStorage.getItem("token");
        if (token) {
            return JSON.parse(token).access;
        }
        return null;
    },
    verifyToken() {
        const token = JSON.parse(window.localStorage.getItem("token"));
        return Promise.resolve(token);
    },
    login(userName, password) {
        const passCode = window.btoa(password);
        this.locker = new Promise((resole, reject) => {
            axiosInstance
                .post("login", null, {
                    headers: {
                        "user-name": userName,
                        "user-pass": passCode,
                    },
                })
                .then(({ data }) => {
                    if (data.token && data.token.access) {
                        this.isAuthenticated = true;
                        window.localStorage.setItem("token", JSON.stringify(data.token));
                        resole(data.token.access);
                    } else {
                        reject("Could not get access token");
                    }
                })
                .catch(err => {
                    this.isAuthenticated = false;
                    reject(err);
                });
        });
        // Return promise
        return this.locker;
    },
};

export default Service;

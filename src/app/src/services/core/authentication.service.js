const axios = require("axios");
const sysConfig = require("../../conf/system.json");
const axiosInstance = axios.create({
    baseURL: sysConfig.env == "prd"
        ? window.location.origin
        : sysConfig.server.address,
});

const Service = function () {
    this.locker = this.verifyToken();
};

Service.prototype = {
    async getToken() {
        try {
            await this.locker;
            const token = window.localStorage.getItem("token");
            if (token) {
                return JSON.parse(token).access;
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
        return null;
    },
    async getUser() {
        try {
            await this.locker;
            const token = window.localStorage.getItem("token");
            if (token) {
                return JSON.parse(token).user;
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
        return null;
    },
    async verifyToken() {
        this.isAuthenticated = false;
        const token = JSON.parse(window.localStorage.getItem("token"));
        if (token && token.exp && token.refresh) {
            const expDate = new Date(token.exp);
            const now = new Date();
            now.setDate(now.getDate() + 1);
            if (now >= expDate) {
                // Renew token
                this.locker = new Promise((resole, reject) => {
                    axiosInstance
                        .post("/renew-token", null, {
                            headers: {
                                authorization: token.refresh,
                            },
                        })
                        .then(({ data }) => {
                            if (data.token && data.token.access) {
                                this.isAuthenticated = true;
                                window.localStorage.setItem(
                                    "token",
                                    JSON.stringify(data.token)
                                );
                                return resole(data.token.access);
                            } else {
                                reject("Could not get access token");
                            }
                        })
                        .catch(err => {
                            console.error("Got an error while refreshing token.", err);
                            reject(err);
                        });
                });
                // Return promise
                return this.locker;
            }

            this.locker = new Promise((resole, reject) => {
                axiosInstance
                    .post("/verify-token", null, {
                        headers: {
                            authorization: token.access,
                        },
                    })
                    .then(({ data }) => {
                        this.isAuthenticated = true;
                        this.user = data;
                        resole(token);
                    })
                    .catch(err => {
                        console.error("Got an error while verify token.", err);
                        reject(err);
                    });
            });
        } else {
            return Promise.reject("No token found");
        }

        return this.locker;
    },
    login(userName, password) {
        this.isAuthenticated = false;
        const passCode = window.btoa(password);
        this.locker = new Promise((resole, reject) => {
            axiosInstance
                .post("/login", null, {
                    headers: {
                        "user-name": userName,
                        "user-pass": passCode,
                    },
                })
                .then(({ data }) => {
                    if (data.token && data.token.access) {
                        this.isAuthenticated = true;
                        this.user = data;
                        window.localStorage.setItem(
                            "token",
                            JSON.stringify(data.token)
                        );
                        resole(data.token.access);
                    } else {
                        reject("Could not get access token");
                    }
                })
                .catch(err => {
                    reject(err);
                });
        });
        // Return promise
        return this.locker;
    },
};

module.exports = Service;

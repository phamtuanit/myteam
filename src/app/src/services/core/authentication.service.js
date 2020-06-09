const axios = require("axios");
const sysConfig = require("../../conf/system.json");
const responseInterceptor = require("../../utils/http-injector/response-injector.js");
const axiosInstance = axios.create({
    baseURL:
        sysConfig.env == "prd"
            ? window.location.origin
            : sysConfig.server.address,
});

const Service = function () {
    responseInterceptor(axiosInstance);
    this.locker = this.verifyToken();
};

Service.prototype = {
    async getToken(count = 0) {
        if (count > 3) {
            throw new Error("Reached maximum retry time.", count);
        }

        try {
            await this.locker;
            const token = window.localStorage.getItem("token");
            if (token) {
                if (this.isExpired(token)) {
                    // Renew token
                    this.locker = this.renewToken();
                    return await this.getUser(++count);
                }
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
    isExpired(token) {
        const expDate = new Date(token.exp);
        const now = new Date();
        now.setDate(now.getDate() + 1);
        return now >= expDate;
    },
    async verifyToken() {
        this.isAuthenticated = false;
        const token = JSON.parse(window.localStorage.getItem("token"));
        if (token && token.exp && token.refresh) {
            if (this.isExpired(token)) {
                // Renew token
                this.locker = this.renewToken();
            } else {
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
                            console.error(
                                "Got an error while verify token.",
                                err
                            );
                            reject(err);
                        });
                });
            }
        } else {
            this.locker = Promise.reject("No token found");
        }

        return await this.locker;
    },
    renewToken() {
        const token = JSON.parse(window.localStorage.getItem("token"));
        return new Promise((resole, reject) => {
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
    async logout() {
        try {
            await this.locker;
        } finally {
            this.locker = Promise.resolve();
            this.isAuthenticated = false;
            window.localStorage.removeItem("token");
        }
    },
};

module.exports = Service;

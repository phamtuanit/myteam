const axios = require('axios');
const eventBus = window.IoC.get("bus");
module.exports = function httpResponseSetup() {
    axios.interceptors.response.use(function successHandler(response) {
        eventBus.$emit('global-loading', { isLoading: false });
        return response;
    }, function errorHandler(err) {
        eventBus.$emit('global-loading', { isLoading: false });
        if (err.response && err.response.status == 401) {
            if (err.config.url.replace(err.config.baseURL, "") == "login") {
                eventBus.$emit("show-snack", { message: "User name or password is wrong! ☹" });
            } else {
                eventBus.$emit("show-snack", { message: "You don't have permission to do that! ☠" });
            }
        } else {
            eventBus.$emit("show-snack", { message: err });
        }
        console.error(err);
        return Promise.reject(err);
    });
}

module.exports = function httpResponseSetup(axios) {
    const eventBus = window.IoC.get("bus");
    axios.interceptors.response.use(
        function successHandler(response) {
            return response;
        },
        function errorHandler(err) {
            if (err.response && err.response.status == 401) {
                if (
                    err.config.url.replace(err.config.baseURL, "") == "/login"
                ) {
                    eventBus.emit("show-snack", {
                        message: "Username or Password is not correct!",
                        type: "error",
                    });
                } else {
                    eventBus.emit("show-snack", {
                        message: "You don't have permission to do that!",
                        type: "error",
                    });
                }
            } else {
                const msg = `${err.response ? err.response.statusText + '. ' : ""}${
                    err.message
                }`;
                eventBus.emit("show-snack", {
                    message: msg,
                    type: "error",
                    data: err,
                });
            }
            console.error(err);
            return Promise.reject(err);
        }
    );
};

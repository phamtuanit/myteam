module.exports = function httpResponseSetup(axios) {
    const eventBus = window.IoC.get("bus");
    axios.interceptors.response.use(
        function successHandler(response) {
            return response;
        },
        function errorHandler(err) {
            console.error(err);
            if (err.response) {
                if (err.response.status == 401) {
                    if (err.config.url.replace(err.config.baseURL, "") == "/login") {
                        eventBus.emit("show-snack", {message: "Username or Password is not correct!", type: "error", });
                    } else {
                        eventBus.emit("show-snack", { message: "There is a permission problem. Please refresh your page.", type: "error", });
                    }
                } else if (err.response.status == 460) {
                    console.warn("Token is expired!", err.response);
                    eventBus.emit("show-snack", { message: "Token is expired!", type: "error", });
                    // Refresh token state -> Need to re-login
                    setTimeout(() => {
                        eventBus.emit("server:unauthenticated", this);
                    }, 1000);
                }  else {
                    const msg = `${err.response ? err.response.statusText + '. ' : ""}${err.message}`;
                    eventBus.emit("show-snack", { message: msg, type: "error", data: err, });
                }
            }
            return Promise.reject(err);
        }
    );
};

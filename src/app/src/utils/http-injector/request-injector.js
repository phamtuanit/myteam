module.exports = function httpRequestSetup(axios) {
    const eventBus = window.IoC.get("bus");
    const auth = window.IoC.get("auth");
    // Configure AXIOS
    axios.defaults.headers.post["Content-Type"] = "application/json";
    axios.interceptors.request.use(
        function(config) {
            if (auth) {
                return auth
                    .getToken()
                    .then(token => {
                        config.headers.Authorization = token;
                        return config;
                    })
                    .catch(console.error);
            }
            return Promise.resolve(config);
        },
        function(err) {
            eventBus.emit("show-snack", { message: err, type: "error" });
            console.error(err);
            return Promise.reject(err);
        }
    );
};

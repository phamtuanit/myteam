const eventBus = window.IoC.get("bus");
const auth = window.IoC.get('auth');
const axios = require('axios');
// Configure AXIOS
axios.defaults.headers.post['Content-Type'] = 'application/json';

module.exports = function httpRequestSetup() {
    axios.interceptors.request.use(function (config) {
        eventBus.emit('global-loading', { isLoading: true });
        if (auth) {
            config.headers.Authorization = auth.getToken();
        }
        return config;
    }, function (err) {
        eventBus.emit('global-loading', { isLoading: false });
        eventBus.emit("show-snack", { message: err });
        console.error(err);
        return Promise.reject(err);
    });
}

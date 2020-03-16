const socket = require('socket.io-client');
const authSvr = window.IoC.get('auth');

/**
 * Socket class
 */
class Socket {
    /**
     * Constructor
     * @param {*} namespace 
     */
    constructor(baseUri, path, retryTimes = 10) {
        this.baseUri = baseUri;
        this.path = path;
        this.retryTimes = retryTimes;
        this.io = null;
        this.subscribers = {};

        const eventBus = window.IoC.get('bus');
        eventBus.on("logout", () => this.close());
        eventBus.on("login", () => this.connect());
    }
    /**
     * Register listener
     * @param {string} evt event name
     * @param {function} callback callback function
     */
    on(evt, callback) {
        if (evt && callback) {
            this.subscribers[evt] = this.subscribers[evt] || [];
            this.subscribers[evt].push(callback);
        }
        return this;
    }
    /**
     * Close Socket
     */
    close() {
        if (this.io) {
            this.io.close();
        }
        this.io = undefined;
        return this;
    }
    /**
     * Connect to server with token
     */
    connect() {
        if (!authSvr.getToken()) {
            console.warn("The user token is empty. The connection will be created after user login.");
            return this;
        }

        this.close();
        this.io = socket(this.baseUri, {
            path: this.path,
            query: {
                token: authSvr.getToken()
            }
        });

        this.registerEvents();
        this.io.connect();
        return this;
    }
    /**
     * Register subscriber to inner socket
     */
    registerEvents() {
        this.io.on('connect', () => {
            console.info("Socket connection is available now");
        });

        this.io.on('connect_error', (error) => {
            console.error("Socket connection is interrupted.", error);
        });

        this.io.on('disconnect', (reason) => {
            console.error("Socket connection is disconnected.", reason);
            if (reason === 'io server disconnect') {
                // The disconnection was initiated by the server, reconnect manually
                this.io.connect();
            }
        });

        Object.keys(this.subscribers).forEach(evt => {
            const callackList = this.subscribers[evt];
            callackList.forEach(callback => {
                this.io.on(evt, callback);
            });
        });
    }
}

module.exports = Socket;

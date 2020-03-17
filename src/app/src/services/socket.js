const socket = require('socket.io-client');
const authSvr = window.IoC.get('auth');

/**
 * Socket class
 */
class Socket {
    /**
     * Constructor
     * @param {*} path 
     */
    constructor(baseUri, path, retryTimes = 10) {
        this.baseUri = baseUri;
        this.path = path;
        this.retryTimes = retryTimes;
        this.io = null;
        this.subscribers = {};

        this.rooms = ["live"];

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

            if (this.io) {
                // WS is connected
                this.io.on(evt, callback);
            }
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
        // Register message handler
        Object.keys(this.subscribers).forEach(evt => {
            const callbackList = this.subscribers[evt];
            callbackList.forEach(callback => {
                this.io.on(evt, callback);
            });
        });

        this.io.on('connect', () => {
            console.info("Socket connection is available now");
            // Join to given room
            this.rooms.forEach(room => {
                this.io.emit('join', room);
            });
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
    }
}

module.exports = Socket;

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
        this.rooms = [];

        this.eventBus = window.IoC.get('bus');
        this.eventBus.on("logout", () => this.close());
        this.eventBus.on("login", () => this.connect());
    }
    /**
     * Get socket status
     *
     * @memberof Socket
     */
    getStatus() {
        return this.io != null && typeof this.io == "object";
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
    emit(evt, payload) {
        if (this.io) {
            payload.created = new Date().getTime();
            this.io.emit(evt, payload);
        } else {
            console.warn("WS is not ready to use.");
        }
        return this;
    }
    /**
     * Close Socket
     */
    close() {
        if (this.io) {
            console.info("Close Socket connection.");
            this.io.close();
        }
        this.io = undefined;
        return this;
    }
    /**
     * Connect to server with token
     */
    connect() {
        this.close();
        return authSvr.getToken().then(token => {
            this.io = socket(this.baseUri, {
                path: this.path,
                query: {
                    token: token
                }
            });

            this.registerEvents();
            this.io.connect();
            return this;
        }).catch(console.error);
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

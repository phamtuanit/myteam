const Vue = require('vue').default;

class Emitter {
    constructor() {
        this.innerBus = new Vue();
    }

    on(evt, callback) {
        this.innerBus.$on(evt, callback);
        return this;
    }

    once(evt, callback) {
        this.innerBus.$once(evt, callback);
        return this;
    }

    off(evt, data) {
        this.innerBus.$off(evt, data);
        return this;
    }

    emit() {
        this.innerBus.$emit(...arguments);
        return this;
    }
}

module.exports = Emitter;

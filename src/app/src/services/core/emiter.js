import Vue from 'vue';

class Emiter {
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

    emit(evt, data) {
        this.innerBus.$emit(evt, data);
        return this;
    }
}

export default Emiter;

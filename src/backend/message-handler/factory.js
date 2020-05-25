const Html = require("./html-controller.js");
module.exports = class ControllerFactory {
    constructor(broker, logger) {
        this.broker = broker;
        this.logger = logger;
        this.controllers = {};
        this.registerBuiltInController();
    }

    getController(msgType) {
        return this.controllers[msgType];
    }

    use(msgType, controller) {
        this.controllers[msgType] = controller;
    }
	
	clean() {
		Object.values(this.controllers).forEach((ctrl) => {
            ctrl.clean();
        });
	}

    registerBuiltInController() {
        this.use("html", new Html(this.broker ,this.logger));
    }
};

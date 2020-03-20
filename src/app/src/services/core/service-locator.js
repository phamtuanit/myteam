module.exports = (function () {
    const ServiceImplementation = function (constructor, args) {
        this.constructor = constructor;
        this.args = args;
    };

    const ServiceDefinition = function (name, constructor, args, lifestyle) {
        this.name = name;
        this.value = new ServiceImplementation(constructor, args);
        this.dependencies = [];
        this.lifestyle = lifestyle || 'singleton';
        this.instance = null;
    };

    const ServiceLocator = function () {
        this.entries = {};
    };

    ServiceLocator.prototype.register = function (name, constructor, args, lifestyle) {
        this.unregister(name);
        this.entries[name] = new ServiceDefinition(name, constructor, args, lifestyle);
    };

    ServiceLocator.prototype.unregister = function (name) {
        if (this.entries[name]) {
            delete this.entries[name];
        }
    };

    ServiceLocator.prototype.get = function (name) {
        var definition = this.entries[name];

        if (!definition) {
            var message = 'No definition for `' + name + '` exists.';
            console.trace(message);
            return undefined;
        }

        var obj;

        if (definition.instance) {
            if (typeof definition.instance === 'function') {
                obj = definition.instance();
            } else if (typeof definition.instance === 'object') {
                obj = definition.instance;
            }
        } else {
            var value = definition.value;
            var constructor = value.constructor;

            // Create instance
            if (typeof constructor === 'function') {
                // The implementation is a Function 
                var tempArgs = value.args || [];
                var args = [];

                // Resolve all Args
                tempArgs.forEach(function (arg) {
                    if (arg && arg instanceof DynamicArg) {
                        arg = arg.$fn();
                    }
                    args.push(arg);
                });

                // Create new instance with Args
                obj = Object.create(constructor.prototype);
                obj.constructor.apply(obj, args);

                if (!Object.keys(constructor.prototype).length && !Object.keys(obj).length) {
                    // non-constructor function
                    // bind args to function for entry instance
                    var boundArgs = [constructor].concat(args);
                    if (definition.lifestyle === 'singleton') {
                        definition.instance = constructor.bind.apply(constructor, boundArgs);
                    }
                } else {
                    if (definition.lifestyle === 'singleton') {
                        definition.instance = obj;
                    }
                }
            } else if (typeof constructor === 'object') {
                obj = constructor; // The implementation is a object
                if (definition.lifestyle === 'singleton') {
                    definition.instance = obj;
                }
            }
        }

        return obj;
    };

    // Support dynamic getting Arg
    function DynamicArg(fn) {
        this.$type = 'dynamicArg';
        this.$fn = fn;
    }

    DynamicArg.prototype.execute = function () {
        return this.$fn();
    };

    ServiceLocator.prototype.createDynamicArg = function (fn) {
        return new DynamicArg(fn);
    };

    return ServiceLocator;
})();

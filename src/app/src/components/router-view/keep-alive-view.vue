<script>
import routerView from "./router-view.vue";

export default {
    name: "KeepAliveView",
    functional: true,
    props: {
        name: {
            type: String,
            default: "default",
        },
    },
    render(_, { props, children, parent, data }) {
        // Used by devtools to display a router-view badge
        data.keepAlive = true;

        // Directly use parent context's createElement() function
        // so that components rendered by router-view can resolve named slots
        const h = parent.$createElement;
        const name = props.name;
        const route = parent.$route;
        const cache = parent._routerViewCache || (parent._routerViewCache = {});
        const viewCache = parent._viewCache || (parent._viewCache = {});

        // Determine current view depth, also check to see if the tree
        // has been toggled inactive but kept-alive.
        let depth = 0;
        while (parent && parent._routerRoot !== parent) {
            const vnodeData = parent.$vnode ? parent.$vnode.data : {};
            if (vnodeData.routerView) {
                depth++;
            }
            parent = parent.$parent;
        }
        data.routerViewDepth = depth;

        const matched = route.matched[depth];
        const component = matched && matched.components[name];

        // Render empty node if no matched route or no config component
        if (!matched || !component) {
            cache[name] = null;
            return h();
        }

        // cache component
        cache[name] = { component };
        const routeName = matched.name;

        if (!viewCache[routeName]) {
            // Attach instance registration hook
            // this will be called in the instance's injected lifecycle hooks
            data.registerRouteInstance = (vm, val) => {
                // val could be undefined for unregistration
                const current = matched.instances[name];
                if ((val && current !== vm) || (!val && current === vm)) {
                    matched.instances[name] = val;
                }
            };

            // Also register instance in prepatch hook in case the same component instance is reused across different routes
            (data.hook || (data.hook = {})).prepatch = (_, vnode) => {
                matched.instances[name] = vnode.componentInstance;
            };

            // Register instance in init hook in case kept-alive component be actived when routes changed
            data.hook.init = vnode => {
                if (
                    vnode.data.keepAlive &&
                    vnode.componentInstance &&
                    vnode.componentInstance !== matched.instances[name]
                ) {
                    matched.instances[name] = vnode.componentInstance;
                }
            };

            const configProps = matched.props && matched.props[name];
            // save route and configProps in cache
            if (configProps) {
                extend(cache[name], {
                    route,
                    configProps,
                });

                fillPropsInData(component, data, route, configProps);
            }

            data.directives || (data.directives = []);
            data.directives.push({
                name: "show",
                value: true,
            });

            // create view
            const currentView = h(component, data, children);
            viewCache[routeName] = { vnode: currentView };
        }

        // Render all cached component
        const aliveComponents = [];
        Object.keys(viewCache).forEach(key => {
            let vnode = viewCache[key].vnode;

            if (vnode.componentInstance) {
                const vm = vnode.componentInstance;
                const hook = key === routeName ? "activated" : "deactivated";

                // Init data
                vm._inactive == null && (vm._inactive = true);
                // Prvent duplicated loop
                if (
                    (hook == "activated" && vm._inactive == true) ||
                    (hook == "deactivated" && vm._inactive == false)
                ) {
                    const handlers = vm.$options[hook];
                    if (handlers) {
                        handlers.forEach(handler => {
                            handler.call(vm);
                        });
                    }
                    vm._inactive = key !== routeName;

                    if (vm._inactive == true) {
                        vm.$el.classList.add("hidden");
                    } else {
                        vm.$el.classList.remove("hidden");
                    }
                }
            }

            aliveComponents.push(vnode);
        });

        return h(
            routerView,
            {
                routerView: true,
                routerViewDepth: data.routerViewDepth,
            },
            aliveComponents
        );
    },
};

function fillPropsInData(component, data, route, configProps) {
    // resolve props
    let propsToPass = (data.props = resolveProps(route, configProps));
    if (propsToPass) {
        // clone to prevent mutation
        propsToPass = data.props = extend({}, propsToPass);
        // pass non-declared props as attrs
        const attrs = (data.attrs = data.attrs || {});
        for (const key in propsToPass) {
            if (!component.props || !(key in component.props)) {
                attrs[key] = propsToPass[key];
                delete propsToPass[key];
            }
        }
    }
}

function resolveProps(route, config) {
    switch (typeof config) {
        case "undefined":
            return;
        case "object":
            return config;
        case "function":
            return config(route);
        case "boolean":
            return config ? route.params : undefined;
        default:
            return;
    }
}

function extend(a, b) {
    for (const key in b) {
        a[key] = b[key];
    }
    return a;
}
</script>

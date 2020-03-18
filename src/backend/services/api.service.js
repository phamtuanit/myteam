"use strict";
const ApiGateway = require("moleculer-web");
const sysConf = require("../conf/system.json");
const SocketService = require("../mixins/socket.mixin");
const Errors = ApiGateway.Errors;

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 * @typedef {import('http').IncomingMessage} IncomingRequest Incoming HTTP Request
 * @typedef {import('http').ServerResponse} ServerResponse HTTP Server Response
 */

module.exports = {
    name: "api",
    mixins: [SocketService, ApiGateway],

    // More info about settings: https://moleculer.services/docs/0.14/moleculer-web.html
    settings: {
        // Exposed port
        port: process.env.PORT || sysConf.gateway.port,

        // Exposed IP
        ip: process.env.HOST || sysConf.gateway.host,

        // Global Express middlewares. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Middlewares
        use: [],

        io: {
            path: "/chat-io"
        },

        routes: [
            {
                // Root
                path: "/",

                // Middlewares
                use: [],

                // Whitelist of actions (array of string mask or regex)
                whitelist: ["**"],

                authorization: false,

                authentication: false,

                cors: {
                    origin: "*",
                    methods: ["GET", "POST", "PUT", "DELETE"],
                    allowedHeaders: "*",
                    credentials: true,
                    maxAge: null
                },

                // Action aliases refreshToken
                aliases: {
                    "POST login": "v1.auth.login",
                    "POST renew-token": "v1.auth.refreshToken"
                },

                // Use bodyparser module
                bodyParsers: {
                    json: true,
                    urlencoded: { extended: true }
                },

                callOptions: {
                    timeout: 3000
                },

                onBeforeCall(ctx, route, req, res) {
                    // Set request headers to context meta
                    ctx.meta.headers = { ...req.headers };
                },

                onAfterCall(ctx, route, req, res, data) {
                    res.setHeader("X-Handler", ctx.nodeID);
                    return data;
                }
            },
            {
                path: "/api",

                whitelist: ["**"],

                // Route-level Express middlewares. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Middlewares
                use: [],

                // Enable/disable parameter merging method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Disable-merging
                mergeParams: true,

                // Enable authentication. Implement the logic into `authenticate` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authentication
                authentication: sysConf.gateway.authentication,

                // Enable authorization. Implement the logic into `authorize` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authorization
                authorization: sysConf.gateway.authorization,

                // Convert "say-hi" action -> "sayHi"
                camelCaseNames: true,

                // The auto-alias feature allows you to declare your route alias directly in your services.
                // The gateway will dynamically build the full routes from service schema.
                autoAliases: true,

                aliases: {},

                /**
                 * Before call hook. You can check the request.
                 * @param {Context} ctx
                 * @param {Object} route
                 * @param {IncomingRequest} req
                 * @param {ServerResponse} res
                 * @param {Object} data
                 * */
                onBeforeCall(ctx, route, req, res) {
                    // Set request headers to context meta
                    res.setHeader("x-handler", ctx.nodeID);
                    if (req.headers["authorization"]) {
                        ctx.meta.token = req.headers["authorization"];
                        if (ctx.meta.token.startsWith("Bearer ")) {
                            ctx.meta.token = ctx.meta.token.slice(7);
                        }
                    }
                    ctx.meta.headers = { ...req.headers };
                },

                /**
                 * After call hook. You can modify the data.
                 * @param {Context} ctx
                 * @param {Object} route
                 * @param {IncomingRequest} req
                 * @param {ServerResponse} res
                 * @param {Object} data
                 * */
                // onAfterCall(ctx, route, req, res, data) {
                // 	// Async function which return with Promise
                // },

                // Global CORS settings
                cors: {
                    origin: "*",
                    methods: ["GET", "POST", "PUT", "DELETE"],
                    allowedHeaders: "*",
                    credentials: true,
                    maxAge: null
                },

                // Calling options. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Calling-options
                callingOptions: {},

                bodyParsers: {
                    json: {
                        strict: false,
                        limit: "1MB"
                    },
                    urlencoded: {
                        extended: true,
                        limit: "1MB"
                    }
                },

                // Mapping policy setting. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Mapping-policy
                mappingPolicy: "all", // Available values: "all", "restrict"

                // Enable/disable logging
                logging: true
            }
        ],

        // Do not log client side errors (does not log an error response when the error.code is 400<=X<500)
        log4XXResponses: false,
        // Logging the request parameters. Set to any log level to enable it. E.g. "info"
        logRequestParams: null,
        // Logging the response data. Set to any log level to enable it. E.g. "info"
        logResponseData: null,

        // Serve assets from "public" folder. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Serve-static-files
        assets: {
            folder: sysConf.gateway.static || "public",

            // Options to `server-static` module
            options: {}
        }
    },

    methods: {
        /**
         * Authenticate the request. It check the `Authorization` token value in the request header.
         * Check the token value & resolve the user by the token.
         * The resolved user will be available in `ctx.meta.user`
         *
         * @param {Context} ctx
         * @param {Object} route
         * @param {IncomingRequest} req
         * @returns {Promise}
         */
        authenticate(ctx, route, req) {
            if (req.$action.auth == true) {
                // Read the token from header
                return this.verifyToken(ctx);
            }
            return null;
        },

        /**
         * Verify given access token
         *
         * @param {*} ctx
         * @returns
         */
        async verifyToken(ctx) {
            const token = ctx.meta.token;
            if (token != undefined && token != "") {
                try {
                    // Verify JWT token
                    const user = await ctx.call("v1.auth.verifyToken", {
                        token
                    });
                    ctx.meta.user = user;
                    return user;
                } catch (err) {
                    this.logger.error(err.message);
                }
            }

            throw new Errors.UnAuthorizedError(Errors.ERR_NO_TOKEN);
        },

        /**
         * Authorize the request. Check that the authenticated user has right to access the resource.
         *
         * @param {*} ctx
         * @param {*} route
         * @param {*} req
         * @returns NUll if you have right permission
         */
        async authorize(ctx, route, req) {
            // It check the `auth` property in action schema.
            if (
                req.$action.auth == true &&
                req.$action.roles &&
                Array.isArray(req.$action.roles)
            ) {
                const user = ctx.meta.user;
                const userEntity = await ctx.call("v1.users.getUser", {
                    id: user.id
                });
                // Check the user role
                if (
                    !userEntity ||
                    userEntity.role == undefined ||
                    userEntity.role == "null" ||
                    req.$action.roles.indexOf(userEntity.role) === -1
                ) {
                    throw new Errors.ForbiddenError(
                        "You don't have right permission"
                    );
                }
            }
            return null;
        }
    }
};

"use strict";
const fs = require("fs");
const path = require("path");
const serveStatic = require("serve-static");
const ApiGateway = require("moleculer-web");
const sysConf = require("../conf/system.json");
const Errors = ApiGateway.Errors;

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 * @typedef {import('http').IncomingMessage} IncomingRequest Incoming HTTP Request
 * @typedef {import('http').ServerResponse} ServerResponse HTTP Server Response
 */

console.info("ENV:", process.env);

const onBeforeCall = function onBeforeCall(ctx, route, req, res) {
    // Set request headers to context meta
    res.setHeader("x-handler", "m_" + ctx.nodeID);
    ctx.meta.headers = { ...req.headers };

    if (ctx.meta.headers["authorization"]) {
        ctx.meta.token = ctx.meta.headers["authorization"];
        if (ctx.meta.token.startsWith("Bearer")) {
            ctx.meta.token = ctx.meta.token.replace("Bearer").trim();
        }
    }
};

module.exports = {
    name: "api",
    version: 1,
    dependencies: ["v1.auth", "v1.authorization", "v1.live"],
    mixins: [ApiGateway],

    // More info about settings: https://moleculer.services/docs/0.14/moleculer-web.html
    settings: {
        // Exposed port
        port: process.env.PORT || sysConf.gateway.port,
        // Exposed IP
        ip: process.env.HOST || sysConf.gateway.host,
        // Global Express middleware. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Middlewares
        use: [],
        // Use HTTP2 server
        http2: true,
        // HTTPS server with certificate
        https: sysConf.ssl.enabled ? {
            key: fs.readFileSync(path.join(__dirname, "../ssl",  "ssl.key")),
            cert: fs.readFileSync(path.join(__dirname, "../ssl", "ssl.cer")),
        } : null,
        // Global CORS settings for all routes
        cors: {
            // Configures the Access-Control-Allow-Origin CORS header.
            origin: "*",
            // Configures the Access-Control-Allow-Methods CORS header. 
            methods: ["GET", "OPTIONS", "POST", "PUT", "DELETE"],
            // Configures the Access-Control-Allow-Headers CORS header.
            allowedHeaders: ["*"],
            // Configures the Access-Control-Expose-Headers CORS header.
            exposedHeaders: [],
            // Configures the Access-Control-Allow-Credentials CORS header.
            credentials: false,
            // Configures the Access-Control-Max-Age CORS header.
            maxAge: 3600
        },
        routes: [
            {
                // Root
                path: "/",
                // Middleware
                use: [],
                // Enable/disable logging
                logging: false,
                // Whitelist of actions (array of string mask or regex)
                whitelist: ["**"],
                // Enable authentication. Implement the logic into `authenticate` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authentication
                authentication: false,
                // Enable authorization. Implement the logic into `authorize` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authorization
                authorization: false,
                // Convert "say-hi" action -> "sayHi"
                cors: {
                    origin: "*",
                    methods: ["GET", "POST", "OPTION"],
                    allowedHeaders: "*",
                    credentials: true,
                    maxAge: 3600,
                },
                mappingPolicy: "restrict", // Available values: "all", "restrict"
                // Action aliases refreshToken
                aliases: {
                    "POST login": "v1.auth.login",
                    "POST renew-token": "v1.auth.refreshToken",
                    "POST verify-token": "v1.auth.verifyToken",
                    "~node/health": "$node.health",
                    "~node/actions": "$node.actions",
                    "~node/list": "$node.list",
                    "~node/services": "$node.services",
                    "~node/options": "$node.options",
                },
                // Use bodyparser module
                bodyParsers: {
                    json: true,
                    urlencoded: { extended: true },
                },
                callOptions: {
                    timeout: 3000,
                },
                onBeforeCall: onBeforeCall,
            },
            {
                path: "/api",
                whitelist: ["**"],
                // Route-level Express middlewares. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Middlewares
                use: [],
                // Enable/disable logging
                logging: true,
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
                // Mapping policy setting. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Mapping-policy
                mappingPolicy: "all", // Available values: "all", "restrict"
                aliases: {},
                // Calling options. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Calling-options
                callingOptions: {},
                bodyParsers: {
                    json: {
                        strict: false,
                        limit: "1MB",
                    },
                    urlencoded: {
                        extended: true,
                        limit: "1MB",
                    },
                },
                onBeforeCall: onBeforeCall,
            },
            {
                path: "/upload",
                logging: false,
                authentication: sysConf.gateway.authentication,
                bodyParsers: {
                    json: false,
                    urlencoded: false,
                },
                mappingPolicy: "restrict", // Available values: "all", "restrict"
                aliases: {
                    // "GET /:id": "attachments.getFile",
                    "POST /": "multipart:v1.attachments.saveFile",
                    "POST /multi/": {
                        type: "multipart",
                        // Action level busboy config
                        busboyConfig: {
                            limits: {
                                files: 3,
                            },
                            onFilesLimit(busboy, alias, svc) {
                                this.logger.info(
                                    "Uploading file limit!",
                                    busboy
                                );
                            },
                        },
                        action: "v1.attachments.saveFiles",
                    },
                },
                // Route level busboy config.
                // More info: https://github.com/mscdex/busboy#busboy-methods
                busboyConfig: {
                    limits: { files: 1 },
                },
                onBeforeCall: onBeforeCall,
                onAfterCall(ctx, route, req, res, data) {
                    if (Array.isArray(data) && data.length == 1) {
                        return data[0];
                    }
                    return data;
                },
            },
        ],
        // Do not log client side errors (does not log an error response when the error.code is 400<=X<500)
        log4XXResponses: false,
        // Logging the request parameters. Set to any log level to enable it. E.g. "info"
        logRequestParams: null,
        // Logging the response data. Set to any log level to enable it. E.g. "info"
        logResponseData: null,
        // Serve assets from "public" folder. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Serve-static-files
        assets: null, // Ignore auto serving sttaic files
        myAssets: {
            folders: process.env.STATIC_DIR || sysConf.gateway.static || "public",
            // Options to `server-static` module
            options: {},
        },
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
            if (token) {
                try {
                    // Verify JWT token
                    const user = await ctx.call("v1.auth.verifyToken", { token, });
                    ctx.meta.user = user;
                    return user;
                } catch (err) {
                    this.logger.error("Could not verify user.", err.message);
                    err.code = err.code || 401;
                    throw err;
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
        authorize(ctx, route, req) {
            if (req.$action.role && !req.$action.roles.includes(-1)) {
                return ctx.call("v1.authorization.canAccess", { target: req.$action })
                    .catch(this.logger.error);
            }
        },
        serveStaticFiles(req, res, callback, index = 0) {
            this.serveRoots[index](req, res, (err) => {
                index++;
                if (index >= this.serveRoots.length) {
                    callback(err);
                    return;
                }
                // Next serve
                this.serveStaticFiles(req, res, callback, index);
            });
        },
        createServeStatic() {
            if (!this.settings.myAssets || !this.settings.myAssets.folders || this.settings.myAssets.folders.length == 0) {
                return;
            }

            this.serveRoots = [];
            const myAssets = this.settings.myAssets;
            const opts = myAssets.options || {};
            myAssets.folders.forEach(dir => {
                const serve = serveStatic(dir, opts);
                this.serveRoots.push(serve);
                this.logger.info("Registered static DIR:", dir);
            });

            this.serve = this.serveStaticFiles;
        }
    },
    /**
	 * Service created lifecycle event handler
	 */
    created() {
        this.createServeStatic();
    }
};

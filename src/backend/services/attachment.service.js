const fs = require("fs");
const path = require("path");
const { MoleculerClientError } = require("moleculer").Errors;
const mkdir = require("mkdirp").sync;
const mime = require("mime-types");
const { hasCode } = require("../utils/entity");

const rootDir = "attachments";
const uploadDir = path.join(__dirname, "../public/" + rootDir);
mkdir(uploadDir);

module.exports = {
    name: "attachments",
    version: 1,
    settings: {},
    dependencies: ["v1.auth", "v1.authorization"],
    mixins: [],
    actions: {
        getFile: {
            params: {
                id: "string",
            },
            handler(ctx) {
                const filePath = path.join(uploadDir, ctx.params.id);
                if (!fs.existsSync(filePath)) {
                    return new MoleculerClientError("File not found.");
                }

                ctx.meta.$responseType = mime.lookup(ctx.params.id);
                // Return as stream
                return fs.createReadStream(filePath);
            },
        },

        saveFile: {
            auth: true,
            params: {
                sub: { type: "string", optional: true, default: "" },
            },
            handler(ctx) {
                const now = new Date();
                let fileType = "files";
                if (ctx.meta.filename) {
                    fileType = this.getFileType(ctx.meta.filename);
                    ctx.meta.filename = `${now.getTime()}__${
                        ctx.meta.filename
                    }`;
                }

                // Prepare folder
                const subDir = path.join(
                    fileType,
                    `${now.getFullYear()}${ now.getMonth() + 1 }`,
                    ctx.params.sub,
                    "" + hasCode(ctx.meta.user.id)
                );

                // Check folder
                const dir = path.join(uploadDir, subDir);
                if (!fs.existsSync(dir)) {
                    mkdir(dir);
                }

                // Make full file path
                const fileName = ctx.meta.filename || this.randomName();
                const filePath = path.join(dir, fileName);

                return new Promise((resolve, reject) => {
                    // Write file
                    const f = fs.createWriteStream(filePath);
                    f.on("close", () => {
                        // File written successfully
                        this.logger.debug(`A file is stored in '${filePath}'`);
                        resolve({
                            url: path.join(rootDir, subDir, fileName),
                            meta: ctx.meta,
                        });
                    });

                    ctx.params.on("error", (err) => {
                        this.logger.warn("File error received", err.message);
                        reject({
                            error: err,
                        });

                        // Destroy the local file
                        f.destroy(err);
                    });

                    f.on("error", (err) => {
                        reject({
                            error: err,
                        });
                        // Remove the errors file.
                        fs.unlinkSync(filePath);
                    });

                    ctx.params.pipe(f);
                });
            },
        },
    },
    methods: {
        randomName() {
            return "unnamed_" + Date.now() + ".png";
        },
        getFileType(fileName) {
            const mimeType = mime.lookup(fileName);
            return mimeType.split("/")[0];
        },
    },
};

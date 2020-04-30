const fs = require("fs");
const path = require("path");
const { MoleculerClientError } = require("moleculer").Errors;
const mkdir = require("mkdirp").sync;
const mime = require("mime-types");

const rootDir = "attachments";
const uploadDir = path.join(__dirname, "../public/" + rootDir);
mkdir(uploadDir);

module.exports = {
    name: "attachments",
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
                if (ctx.meta.filename) {
                    ctx.meta.filename = `${now.getTime()}__${
                        ctx.meta.filename
                    }`;
                }
                return new Promise((resolve, reject) => {
                    // Prepare folder
                    const subDir = path.join(
                        ctx.params.sub,
                        "" + now.getFullYear()
                    );

                    // Check folder
                    const dir = path.join(uploadDir, subDir);
                    if (!fs.existsSync(dir)) {
                        mkdir(dir);
                    }

                    // Make full file path
                    const fileName = ctx.meta.filename || this.randomName();
                    const filePath = path.join(dir, fileName);

                    // Write file
                    const f = fs.createWriteStream(filePath);
                    f.on("close", () => {
                        // File written successfully
                        this.logger.info(
                            `Uploaded file stored in '${filePath}'`
                        );
                        resolve({
                            url: path.join(rootDir, subDir, fileName),
                            meta: ctx.meta,
                        });
                    });

                    ctx.params.on("error", (err) => {
                        this.logger.info("File error received", err.message);
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
    },
};

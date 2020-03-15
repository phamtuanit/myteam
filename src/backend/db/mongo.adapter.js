const dbConf = require("../conf/db.json");
const MongoAdapter = require("moleculer-db-adapter-mongo");

module.exports = function (collection, service) {
    // Mongo adapter
    const uri = process.env.MONGO_URI || dbConf.mongodb.uri;
    const serviceConf = {
        schema: {
            collection: collection
        },
        logger: service.logger
    };

    const adapter = new MongoAdapter(uri, { useUnifiedTopology: true }, dbConf.mongodb.dbName);
    adapter.init(null, serviceConf);

    return adapter;
};

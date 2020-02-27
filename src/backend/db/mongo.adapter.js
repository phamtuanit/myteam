
const dbConf = require("../conf/db.json");

module.exports = function (collection, service) {
    // Mongo adapter
    const MongoAdapter = require("moleculer-db-adapter-mongo");
    const uri = process.env.MONGO_URI || dbConf.mongodb.uri;
    const serviceConf = {
        schema: {
            collection: collection
        },
        logger: service.logger
    };

    const adapter = new MongoAdapter(uri, null, dbConf.mongodb.dbName);
    adapter.init(null, serviceConf);

    return adapter;
};

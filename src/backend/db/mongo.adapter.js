const dbConf = require("../conf/db.json");
const MongoAdapter = require("moleculer-db-adapter-mongo");

class MongoAdapterExt extends MongoAdapter {
    constructor(uri, opts, dbName) {
        super(uri, opts, dbName);
    }

	/**
	 * Update an entity by filter
	 *
	 * @param {String} filter - filter object
	 * @param {Object} update
	 * @returns {Promise<Object>} Return with the updated document.
	 *
	 * @memberof MongoDbAdapterExt
	 */
    update(filter, update) {
		return this.collection.findOneAndUpdate(filter, update, { returnOriginal : false }).then(res => res.value);
	}
}

module.exports = function(collection, service) {
    // Mongo adapter
    const uri = process.env.MONGO_URI || dbConf.mongodb.uri;
    const serviceConf = {
        schema: {
            collection: collection,
        },
        logger: service.logger,
    };

    const adapter = new MongoAdapterExt(
        uri,
        { useUnifiedTopology: true },
        dbConf.mongodb.dbName
    );
    adapter.init(null, serviceConf);

    return adapter;
};

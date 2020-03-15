const MongoDBAdapter = require("../db/mongo.adapter");
module.exports = {
    methods: {
        getDBCollection(collection) {
            if (!this.dbCollections[collection]) {
                const gettingTask = new Promise((resolve, reject) => {
                    const dbCl = MongoDBAdapter(collection, this);
                    dbCl.connect().then(() => {
                        resolve(dbCl);
                        this.logger.debug(">>>> Collection adapter is ready", collection);
                    }).catch(err => {
                        this.logger.warn(err);
                        reject(err.message);
                        delete this.dbCollections.collection;
                    });
                });
                this.dbCollections[collection] = gettingTask;
                return gettingTask;
            }
            return this.dbCollections[collection];
        },
    },
    /**
    * Service created lifecycle event handler
    */
    async created() {
        this.dbCollections = {};
    },
    /**
    * Service stopped lifecycle event handler
    */
    stopped() {
        Object.values(this.dbCollections).forEach(db => {
            db.then(db => {
                this.logger.info(">>>> Disconnect to DB");
                db.disconnect();
            });
        });
    }
};

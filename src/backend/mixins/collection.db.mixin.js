const MongoDBAdapter = require("../db/mongo.adapter");
module.exports = {
    methods: {
        getDBCollection(collection) {
            if (!this.dbCollections[collection]) {
                const dbCl = MongoDBAdapter(collection, this);
                this.dbCollections[collection] = dbCl;
                this.logger.info("Created collection adapter:", collection);
                return dbCl.connect().then(() => {
                    return dbCl;
                });
            }
            return Promise.resolve(this.dbCollections[collection]);
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
       this.dbCollections.forEach(db => {
           db.disconnect();
       });
   }
};

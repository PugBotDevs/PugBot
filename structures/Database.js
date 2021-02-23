const Keyv = require("keyv");
const KeyvMongo = require("@keyv/mongo");
const store = new KeyvMongo(process.env.DB);

class db {
    constructor(collection){
        const db = new Keyv({ store, collection: collection});
        return db;
    }
}
module.exports = db;
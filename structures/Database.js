/* eslint-disable no-async-promise-executor */
require('dotenv').config();
const { MongoClient } = require('mongodb');
const env_uri = process.env.DB;

class Client {

    constructor(uri = env_uri) {
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        this.client = client;
        this.uri = uri;
        this.connected == false;
        this.dbs = new Array();
        return this;
    }

    connect() {
        return new Promise(async(res, rej) => {
            await this.client.connect().catch(err => {
                return rej(err);
            });
            this.connected = true;
            this.dbs.forEach(t => {
                this[t] = this[t].connect(this.client);
            });
            res(this);
        });
    }

    createDatabase(db_name, coll, name) {
        const db = new DB(db_name, coll);
        this[name] = db;
        this.dbs.push(name);

        return db;
    }


}
class DB {

    constructor(db, coll) {
        this.name = db;
        this.coll = coll;
        this.ops = undefined;

        return this;
    }

    connect(client) {
        this.ops = client.db(this.name).collection(this.coll);
        return this;
    }

    get(id) {
        return new Promise(async(res, rej) => {
            const get = await this.ops.findOne({ id: { $eq: id } }).catch(err => {
                return rej(err);
            });
            if (get)
                res(get);
            else
                res(void 0);
        });
    }

    set(id, obj) {
        return new Promise(async(res, rej) => {
            const reply = await this.ops.updateOne({
                id: { $eq: id },
            }, { $set: obj }, { upsert: true }).catch(error => {
                return rej(error);
            });
            if (reply)
                res(obj);

            res(void 0);
        });
    }

}
module.exports = Client;

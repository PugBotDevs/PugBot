const uCache = require('../app').cache.users;
const db = require('../app').db.users;

class User {

    constructor(id) {
        this.globalElo = 1400;
        // Elos mapped by channel id;
        this.elos = {};
        this.id = id;
    }

    deserialize() {
        return {
            globalElo: this.globalElo,
            elos: this.elos,
            id: this.id,
        };
    }

    elo(id) {
        if (id)
            return this.elos[id];
        else return this.globalElo;
    }

    eloUpdate(value, id) {
        if (typeof value == 'undefined') throw 'Elo can\'t be undefined';
        if (id)
            this.elos[id] = value;
        else
            this.globalElo = value;
        return this;
    }

    updateCache() {
        return uCache.set(this.id, this);
    }

    async updateDB() {
        return db.set(this.id, this.deserialize());
    }

}

module.exports = User;

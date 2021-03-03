class Pugger {

    constructor(client, data) {
        this.client = client;
        this.globalElo = data?.globalElo || 1400;
        // Elos mapped by channel id;
        this.elos = data?.elos || {};
        this.id = data?.id;
        this.queued = [];
        this.game = null;
    }

    setDefault(id) {
        this.elos[id] = 1400;
        return this;
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
        return this.client.puggers.cache.set(this.id, this);
    }

    async updateDB() {
        return this.client.db.users.set(this.id, this.deserialize());
    }

}

module.exports = Pugger;

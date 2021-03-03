const { states } = require("./Game");

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

    async queue(channelId, pickup) {
        let channel = await this.client.pickups.fetchChannel(channelId);
        pickup = channel?.find(p => p.name == pickup);
        if(pickup) { // If pickup is found
            let game = Object.values(pickup.games).find(x => x.state == states[0]);
            if (!game) { // If no queueable Game found, make a new Game
                let count = this.client.pickups.count.get(channelId);
                if (!count) {
                    channel.forEach(x => {
                        if (x.count > count) count = x.count;
                    });
                }
                if (!count) count = 1;
                game = pickup.add(count);
            }
            let isFull = game.addMember(this.id);
            this.queued.push(channelId + "_" + game.id);
            return { game, isFull };
        } else return false;
    }

    updateCache() {
        return this.client.puggers.cache.set(this.id, this);
    }

    async updateDB() {
        return this.client.db.users.set(this.id, this.deserialize());
    }

}

module.exports = Pugger;

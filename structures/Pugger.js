const { states } = require('./Game');

class Pugger {

    constructor(client, data) {
        this.client = client;
        this.globalElo = data?.globalElo || 1400;
        // Elos mapped by channel id;
        this.elos = data?.elos || {};
        this.id = data?.user?.id || data.id;
        this.user = data?.user;
        this.queued = [];
        this.game = null;
        this.client.puggers.cache.set(this.id, this);
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

    async queue(channel, pickup) {
        const pChannel = await this.client.pickups.fetchChannel(channel);
        pickup = pChannel?.find(p => p.name == pickup);
        if (pickup) { // If pickup is found
            let game = Object.values(pickup.games).find(x => x.state == states[0]);
            if (!game) { // If no queueable Game found, make a new Game
                let count = this.client.pickups.count.get(channel.id);
                if (!count) { // Checks for counts of individual Pickups for a channel and takes the highest one
                    channel.forEach(x => {
                        if (x.count > count) count = x.count;
                    });
                }
                if (!count) count = 1; // If no count found, set count to 1
                game = pickup.add(count);
            }
            const isFull = game.addMember(this);
            this.queued.push(game);
            return { game, isFull };
        } else return false;
    }

    async unqueue(channelId, pickup) {
        const gameIndex = this.queued.findIndex(g => g.name == pickup && g.channel == channelId);
        if (gameIndex != -1) {
            const game = this.queued[gameIndex];
            const res = game.removeMember(this.id);
            if (res) {
                this.queued.splice(gameIndex, 1);
                return game;
            } else return false;
        } else return false;
    }

    async updateDB() {
        return this.client.db.users.set(this.id, this.deserialize());
    }

}

module.exports = Pugger;

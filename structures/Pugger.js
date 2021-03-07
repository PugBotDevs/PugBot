const { states } = require('./Game');

class Pugger {

    constructor(client, data) {
        this.client = client;
        this.elo = {
            rank: data?.elo?.rank || 1400,
            signum: data?.elo?.sigma || 25,
        };
        // Elos mapped by channel id;
        this.elos = data?.elos || {};
        this.id = data?.user?.id || data.id;
        this.user = data?.user;
        this.queued = [];
        this.game = null;
        this.client.puggers.cache.set(this.id, this);
        return this;
    }

    setDefault(id, defaults = { rank: 1400, sigma: 25 }) {
        if (!id) {
            this.elo = {
                rank: defaults.rank,
                sigma: defaults.sigma,
            };
        } else {
            this.elos[id] = {
                rank: defaults.rank,
                sigma: defaults.sigma,
            };
        }
        return this;
    }

    deserialize() {
        return {
            elo: this.elo,
            elos: this.elos,
            id: this.id,
        };
    }

    getElo(id) {
        if (id) {
            const elo = this.elos[id];
            if (!elo) return this.setDefault(id).getElo(id);
            return elo;
        } else {
            const elo = this.elo;
            if (!elo) return this.setDefault().getElo();
            return this.elo;
        }
    }

    /**
     * @param  {Object} value, { rank: Int, sigma: Int}
     * @param  {String} id
     */
    updateElo(value, id) {
        if (typeof value !== 'object') throw 'Elo can only be an object of {rank: Int, sigma: Int}';
        if (id)
            this.elos[id] = value;
        else
            this.elo = value;
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

    setGame(game) {
        this.game = game;
        return this;
    }

}

module.exports = Pugger;

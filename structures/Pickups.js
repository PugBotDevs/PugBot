const Game = require('./Game');
class Pickups {

    constructor(client, opts, channelOpts = {}) {
        this.client = client;
        this.name = opts.name;
        this.size = opts.size;

        // Inherit channel opts
        this.realOpts = opts.opts;
        this.opts = channelOpts;
        Object.assign(this.opts, this.realOpts);

        this.channel = opts.channel;
        this.id = opts.channel.id;
        this.count = 0;
        this.games = {};
        this.gameIDs = [];
        return this;
    }

    add() {
        let count = this.client.pickups.count.get(this.channel.id);
        if (!count) {
            const res = this.client.db.channels.get(this.channel.id);
            if (res && res.count) count = res.count;
        }
        if (!count) count = 1;
        const game = new Game(this.client, this, count);
        this.count = count + 1;
        this.updateDBCount(this.count);
        this.games[game.id] = game;
        this.gameIDs.push(game.id);
        return game;
    }

    remove(gameID) {
        this.games[gameID] = null;
        const index = this.gameIDs.indexOf(gameID);
        if (index >= 0) {
            this.gameIDs.splice(index, 1);
            return true;
        }
        return false;
    }

    deserialize() {
        return {
            name: this.name,
            size: this.size,
            opts: this.realOpts,
            channel: this.channel.id,
            id: this.id,
        };
    }

    async updateDBCount(count) {
        const res = await this.client.db.channels.get(this.channel.id);
        res.count = count;
        this.client.pickups.count.set(this.channel.id, count);
        await this.client.db.channels.set(this.channel.id, res);
    }

}

module.exports = Pickups;
module.exports.defaultOpts = {
    pick: 'AUTO',
    readyWait: 120000,
    maps: [],
    ranked: false,
    teams: true,
};

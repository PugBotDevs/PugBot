const Game = require('./Game');
// eslint-disable-next-line no-unused-vars
const db = require('../app').db.channels;
const cacheCount = require('../app').cache.pickupsCount;
class Pickups {

    constructor(opts) {
        this.name = opts.name;
        this.size = opts.size;
        this.opts = opts.opts;
        this.channel = opts.channel;
        this.count = 0;
        this.games = {};
        this.gameIDs = [];
    }

    add() {
        let count = cacheCount[this.channel];
        if (!count) {
            const res = db.get(this.channel);
            if (res && res.count) count = res.count;
        }
        if (!count) count = 1;
        const game = new Game(this.name, this.size, this.opts, this.channel, count);
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
            opts: this.opts,
            channel: this.channel,
            id: this.id,
        };
    }

    async updateDBCount(count) {
        const res = await db.get(this.channel);
        res.count = count;
        cacheCount.set(this.channel, count);
        await db.set(this.channel, res);
    }

}

module.exports = Pickups;
module.exports.defaultOpts = {
    pick: 'AUTO',
    readyWait: 120000,
};

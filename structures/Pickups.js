const Game = require('./Game');
const db = require('../db').base;
db;
class Pickups {
    constructor(opts) {
        this.name = opts.name;
        this.size = opts.size;
        this.opts = opts.opts;
        this.channel = opts.channel;
        this.id = 0;
        this.games = {};
        this.gameIDs = [];
    }
    add(id) {
        const game = new Game(this.name, this.size, this.opts, this.channel, this.id);
        this.id = id;
        this.games[game.id] = game;
        this.gameIDs.push(game.id);
        return game;
    }
    remove(gameID) {
        this.games[gameID] = null;
        const index = this.gameIDs.indexOf(gameID);
        if (index >= 0 ){
            this.gameIDs.splice(index,1);
            return true;
        }
        return false;
    }
    deserialize() {
        return {
            name : this.name,
            size : this.size,
            opts : this.opts,
            channel : this.channel,
            id: this.id,
        } 
    }
}

module.exports = Pickups;
module.exports.defaultOpts = {
    pick: 'AUTO',
    readyWait : 120000
}
const { Collection } = require('discord.js');

class PuggerManager {

    constructor(client) {
        this.client = client;
        this.cache = new Collection();
    }

}

module.exports = PuggerManager;

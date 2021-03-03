const { Collection } = require('discord.js');
const Pugger = require('./Pugger');

class PuggerManager {

    constructor(client) {
        this.client = client;
        this.cache = new Collection();
    }

    async fetch(id) {
        let pugger = this.cache.find(p => p.id == id);
        if(pugger) {
            return pugger;
        } else {
            pugger = await this.client.db.users.get(id);
            if(pugger)
                pugger = new Pugger(this.client, pugger);
            else
                pugger = new Pugger(this.client, { id });
            
            await pugger.updateDB();
            pugger.updateCache();
            return pugger;
        }
    }

}

module.exports = PuggerManager;

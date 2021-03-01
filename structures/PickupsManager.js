const { Collection } = require("discord.js");
const Pickups = require("./Pickups");

class PickupsManager {
    constructor(client){
        this.client = client;
        this.cache = new Collection(); // Pickups
        this.count = new Collection(); // PickupsCount
    }

    fetchChannel(id) {
        return new Promise(async (res, rej) => {
            // Reject if the parent client does not have a database connected to it
            if(!this.client.db) rej(new Error("Database Not Connected"));

            // Attempt to find the channel in the cache
            let channel = this.cache.get(id);

            // If not cached, resolve data from database
            if(!channel) {
                channel = await this.client.db.channels.get(id);
                if(typeof channel == "object" && channel.arr){
                    channel = channel.arr;
                    this.count.set(id, channel.count);
                    channel = channel.map(pickups => new Pickups(pickups));
                    this.cache.set(id, channel);
                } else channel = undefined;
            }

            // Resolve with final channel value
            res(channel);
        });
    }
}

module.exports = PickupsManager;
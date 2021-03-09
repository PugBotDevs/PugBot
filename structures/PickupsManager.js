/* eslint-disable no-async-promise-executor */
const { Collection } = require('discord.js');
const Pickups = require('./Pickups');

class PickupsManager {

    constructor(client) {
        this.client = client;
        this.cache = new Collection(); // Pickups
        this.count = new Collection(); // PickupsCount
    }

    fetchChannel(discordChannel) {
        const id = discordChannel.id;
        return new Promise(async(res, rej) => {
            // Reject if the parent client does not have a database connected to it
            if (!this.client.db) rej(new Error('Database Not Connected'));

            // Attempt to find the channel in the cache
            let channel = this.cache.get(id);

            // If not cached, resolve data from database
            if (!channel) {
                channel = await this.client.db.channels.get(id);
                if (typeof channel == 'object' && channel.arr) {
                    const opts = channel.opts;
                    this.count.set(id, channel.count);
                    channel = channel.arr;
                    channel = channel.map(pickups => {
                        pickups.channel = discordChannel;
                        return new Pickups(this.client, pickups, opts);
                    });
                    this.cache.set(id, channel);
                } else channel = undefined;
            }

            // Resolve with final channel value
            res(channel);
        });
    }

    async fetch(discordChannel, name) {
        const pickupsChannel = await this.fetchChannel(discordChannel);
        if (!pickupsChannel) return undefined;

        const pickups = pickupsChannel.find(p => p.name == name);
        if (!pickups) return undefined;

        return pickups;
    }

    async createPickups(options) {
        const { channel, name } = options;

        let pickupsConf = await this.client.db.channels.get(channel.id);
        if (!pickupsConf || !pickupsConf.arr) {
            pickupsConf = {
                arr: new Array(),
                count: 1,
                opts: Pickups.defaultOpts,
            };
        }
        if (pickupsConf.arr.find(x => x.name == name))
            return 'Pickups with that name already exists!';

        const pickups = new Pickups(this.client, options, pickupsConf.opts);

        pickupsConf.arr.push(pickups.deserialize());
        const set = await this.client.db.channels.set(channel.id, pickupsConf);
        if (set) {
            let pickupsChannel = this.cache.get(channel.id);
            if (!pickupsChannel) {
                this.cache.set(channel.id, {});
                pickupsChannel = new Array();
            }
            pickupsChannel.push(pickups);
            this.cache.set(channel.id, pickupsChannel);
            return true;
        } else
            return 'Database failed, contact DEVS!';
    }

    /**
     * @param  {String} name
     * @param  {String} channel
     * @returns {String || True } String if operation failed, True if operation succeeded.
     */
    async removePickups(name, channel) {
        const pickupsConf = await this.client.db.channels.get(channel);
        if (!pickupsConf || !pickupsConf.arr)
            return 'Did not find any pickups in this channel!';

        const pickupsIndex = pickupsConf.arr.findIndex(x => x.name == name);
        if (pickupsIndex < 0)
            return 'No Pickups with that name was found!';

        pickupsConf.arr.splice(pickupsIndex, 1);
        const set = await this.client.db.channels.set(channel, pickupsConf);
        if (set) {
            const pickupsChannel = this.cache.get(channel);
            if (!pickupsChannel) this.cache.set(channel, {});
            const cacheIndex = pickupsChannel.findIndex(x => x.name == name);
            if (cacheIndex >= 0)
                pickupsChannel.splice(cacheIndex, 1);
            return true;
        } else
            return 'Database failed, contact DEVS!';
    }

}

module.exports = PickupsManager;

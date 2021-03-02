/* eslint-disable no-async-promise-executor */
const { Collection } = require('discord.js');
const Pickups = require('./Pickups');

class PickupsManager {

    constructor(client) {
        this.client = client;
        this.cache = new Collection(); // Pickups
        this.count = new Collection(); // PickupsCount
    }

    fetchChannel(id) {
        return new Promise(async(res, rej) => {
            // Reject if the parent client does not have a database connected to it
            if (!this.client.db) rej(new Error('Database Not Connected'));

            // Attempt to find the channel in the cache
            let channel = this.cache.get(id);

            // If not cached, resolve data from database
            if (!channel) {
                channel = await this.client.db.channels.get(id);
                if (typeof channel == 'object' && channel.arr) {
                    channel = channel.arr;
                    this.count.set(id, channel.count);
                    channel = channel.map(pickups => new Pickups(this.client, pickups));
                    this.cache.set(id, channel);
                } else channel = undefined;
            }

            // Resolve with final channel value
            res(channel);
        });
    }

    async createPickups(options) {
        const { channel, name } = options;
        Object.assign(options, { opts: Pickups.defaultOpts });
        const pickups = new Pickups(this.client, options);

        let pickupsConf = await this.client.db.channels.get(channel);
        if (!pickupsConf || !pickupsConf.arr) {
            pickupsConf = {
                arr: new Array(),
                count: 1,
            };
        }
        if (pickupsConf.arr.find(x => x.name == name))
            return 'Pickups with that name already exists!';

        pickupsConf.arr.push(pickups.deserialize());
        const set = await this.client.db.channels.set(channel, pickupsConf);
        if (set) {
            let pickupsChannel = this.cache.get(channel);
            if (!pickupsChannel) {
                this.cache.set(channel, {});
                pickupsChannel = new Array();
            }
            pickupsChannel.push(pickups);
            this.cache.set(channel, pickupsChannel);
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

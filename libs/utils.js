const Discord = require('discord.js');
const { pickups: pCache, pickupsCount: cCache } = require('../app').cache;
const Pickups = require('../structures/Pickups');
const Game = require('../structures/Game');
const db = require('../app').db.channels;

/**
 * Updates cache with Game data
 * @param {Game} game
 * @param {Pickups} pickups
 * @param {Discord.TextChannel} channel
 */
const updateCache = (game, pickups, channel) => {
    if (!(pickups instanceof Pickups)) throw new Error('Received deserialized!');
    pickups.games[game.id] = game;
    let pickupsChannel = pCache.get(channel.id);
    if (!pickupsChannel) pickupsChannel = {};
    pickupsChannel[pickups.name] = pickups;
    pCache.set(channel.id, pickupsChannel);
};

/**
 * Fetches all Pickups for a Channel
 * @param {Discord.TextChannel} channel
 * @returns {Array<Pickups>} An Array of Pickups instances
 */
const getPickupChannel = async(channel) => {
    let pickupsChannel = pCache.get(channel);
    if (!pickupsChannel) {
        pickupsChannel = await db.get(channel);
        if (typeof pickupsChannel == 'object' && pickupsChannel.arr) {
            pickupsChannel = pickupsChannel.arr;
            cCache.set(channel, pickupsChannel.count);
            pickupsChannel = pickupsChannel.map(pickups => new Pickups(pickups));
            pCache.set(channel, pickupsChannel);
        } else pickupsChannel = undefined;
    }
    return pickupsChannel;
};

module.exports = {
    updateCache,
    getPickupChannel,
};

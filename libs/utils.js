const Discord = require("discord.js");
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
    pCache[channel.id][pickups.name] = pickups;
};

/**
 * Fetches all Pickups for a Channel
 * @param {Discord.TextChannel} channel
 * @returns {Array<Pickups>} An Array of Pickups instances
 */
const getPickupChannel = async(channel) => {
    let pickupsChannel = pCache[channel];
    if (!pickupsChannel) {
        pickupsChannel = await db.get(channel);
        if (typeof pickupsChannel == 'object' && pickupsChannel.arr) {
            pickupsChannel = pickupsChannel.arr;
            cCache[channel] = pickupsChannel.count;
            pickupsChannel = pickupsChannel.map(pickups => new Pickups(pickups));
            pCache[channel] = pickupsChannel;
        } else pickupsChannel = undefined;
    }
    return pickupsChannel;
};

module.exports = {
    updateCache,
    getPickupChannel,
};

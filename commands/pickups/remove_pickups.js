const { Command } = require('discord.js-commando');

module.exports = class command extends Command {

    constructor(client) {
        super(client, {
            name: 'remove_pickups',
            aliases: ['remp'],
            group: 'pickups',
            memberName: 'remove_pickups',
            description: 'Removes a pickups',
            guildOnly: true,
        });
    }

    async run(message, args = '') {
        const cache = this.client.cache;
        const db = this.client.db.channels;

        args = args.split(' ');
        if (!args || args.length != 1)
            return message.reply('I Need one argument (Pickups Name)');

        const name = args[0];

        const pickupsConf = await db.get(message.channel.id);
        if (!pickupsConf || !pickupsConf.arr)
            return message.reply('Did not find any pickups in this channel!');

        const pickupsIndex = pickupsConf.arr.findIndex(x => x.name == name);
        if (pickupsIndex < 0)
            return message.reply('No Pickups with that name was found!');

        pickupsConf.arr.splice(pickupsIndex, 1);
        const set = await db.set(message.channel.id, pickupsConf);
        if (set) {
            if (!cache.pickups[message.channel.id]) cache.pickups[message.channel.id] = [];
            const cacheIndex = cache.pickups[message.channel.id].findIndex(x => x.name == name);
            if (cacheIndex >= 0)
                cache.pickups[message.channel.id].splice(cacheIndex, 1);

            return message.reply(`Successfully removed pickups: ${name}`);
        } else
            return message.reply('Fatal Error! DM Devs!');
    }

};

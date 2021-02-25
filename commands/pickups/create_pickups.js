const { Command } = require('discord.js-commando');
const Pickups = require('../../structures/Pickups');

module.exports = class command extends Command {

    constructor(client) {
        super(client, {
            name: 'create_pickups',
            aliases: ['newpickups'],
            group: 'pickups',
            memberName: 'create_pickups',
            description: 'Makes a new pickup',
            guildOnly: true,
        });
    }

    async run(message, args = '') {
        const cache = this.client.cache;
        const db = this.client.db.channels;

        args = args.split(' ');
        if (!args || args.length != 2)
            return message.reply('Need 2 arguments  (Eg: PickupsName MembersNum)');

        const [name, size] = args;

        if (isNaN(size)) return message.reply('Second argument needs to be a number!');
        const opts = Pickups.defaultOpts;
        const pickups = new Pickups({ name, size: parseInt(size) * 2, channel: message.channel.id, opts });

        let pickupsConf = await db.get(message.channel.id);
        if (!pickupsConf || !pickupsConf.arr) {
            pickupsConf = {
                arr: new Array(),
                count: 1,
            };
        }
        if (pickupsConf.arr.find(x => x.name == name))
            return message.reply('Pickups with that name already exists!');

        pickupsConf.arr.push(pickups.deserialize());

        const set = await db.set(message.channel.id, pickupsConf);
        if (set) {
            if (!cache.pickups[message.channel.id]) cache.pickups[message.channel.id] = [];
            cache.pickups[message.channel.id].push(pickups);
            console.log(cache.pickups[message.channel.id]);
            return message.reply(`Successfully added pickups: ${name}\n do !queue ${name} or +${name} to queue for it, it will require ${pickups.size} players..`);
        } else
            return message.reply('Fatal Error! DM Devs!');
    }

};

const { Command } = require('discord.js-commando');

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
        args = args.split(' ');
        if (!args || args.length != 2)
            return message.reply('Need 2 arguments  (Eg: PickupsName MembersNum)');

        const [name, size] = args;

        if (isNaN(size)) return message.reply('Second argument needs to be a number!');

        const pickups = await message.client.pickups.createPickups({ name, size: parseInt(size) * 2, channel: message.channel.id });

        if (typeof pickups == 'string')
            return message.reply(pickups);
        else if (pickups === true)
            return message.reply(`Successfully added pickups: ${name}\n do !queue ${name} or +${name} to queue for it, it will require ${parseInt(size) * 2} players..`);
    }

};

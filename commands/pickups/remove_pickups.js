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
        args = args.split(' ');
        if (!args || args.length != 1)
            return message.reply('I Need one argument (Pickups Name)');

        const name = args[0];
        const pickups = await message.client.pickups.removePickups(name, message.channel.id);
        if (pickups === true)
            return message.reply(`Successfully removed pickups: ${name}`);
        else if (typeof pickups === 'string')
            return message.reply(pickups);
        else
            return message.reply('ERR: UNKNOWN Command failed!');
    }

};

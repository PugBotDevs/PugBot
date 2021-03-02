const states = require('../../structures/Game').states;

const { MessageEmbed } = require('discord.js');

const { Command } = require('discord.js-commando');
module.exports = class command extends Command {

    constructor(client) {
        super(client, {
            name: 'who',
            aliases: [],
            group: 'pickups',
            memberName: 'who',
            description: 'Shows all active pickups info',
            guildOnly: true,
        });
    }

    async run(message) {
        const pickups = await message.client.pickups.fetchChannel(message.channel.id);
        const embed = new MessageEmbed()
            .setTitle('Currently active pickups')
            .setColor('GREEN');
        pickups.forEach(x => {
            let field = '';
            x.gameIDs.forEach(id => {
                const game = x.games[id];
                if (game.state == states[0])
                    field += `ID: ${game.id}\nState: *IN QUEUE*\nPlayers: **${game.size}/${game.maxSize}**`;
                else
                    field += `ID: ${game.id}\nState: IN PROGRESS...`;
            });
            embed.addField(x.name, field || 'No match in progress');
        });
        message.embed(embed);
    }

};

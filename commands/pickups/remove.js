const states = require('../../structures/Game').states;

const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');

const run = async(message) => {
    let pickupsNames;
    if (message.content.startsWith('-')) {
        pickupsNames = message.content.substring(1).split(' ');
        if (pickupsNames[0] == '-')
            pickupsNames = 'all';
    } else
        pickupsNames = message.content.split(' ').splice(1);

    if (!pickupsNames) return message.reply('No pickups found!');

    const pickupsChannel = await message.client.pickups.fetchChannel(message.channel.id);
    if (!pickupsChannel) return;
    let left = new Array();
    if (pickupsNames instanceof Array) {
        pickupsNames.forEach(pickupsName => {
            const pickups = pickupsChannel.find(x => x.name == pickupsName);
            if (pickups) {
                const game = Object.values(pickups.games).find(x => x.state == states[0]);
                if (game) {
                    game.removeMember(message.author.id);
                    left.push(game);
                    message.client.pickups.updateCache(game, pickups, message.channel.id);
                }
            }
        });
    } else { // Leave all games which are in queue
        left = pickupsChannel.map(pickups => {
            const game = Object.values(pickups.games).find(x => x.state = states[0]);
            if (game) {
                game.removeMember(message.author.id);
                message.client.pickups.updateCache(game, pickups, message.channel.id);
                return game;
            }
            return void 0;
        });
        left = left.filter(x => x);
    }

    if (left.length > 0) {
        const embed = new MessageEmbed().setColor('ORANGE');
        if (left.length - 1) {
            embed.setTitle(`Successfully left from queues of ${left.map(x => x.name).join(', ')}`);
            left.forEach(game => {
                embed.addField(`${game.name}(${game.id})`, `${game.size}/${game.maxSize} people in queue`);
            });
        } else {
            embed.setTitle(`Succesfully left from queue of ${left[0].name}`);
            embed.setDescription(`${left[0].size}/${left[0].maxSize} people in queue`);
        }
        message.reply(embed);
    }
};
module.exports = class command extends Command {

    constructor(client) {
        super(client, {
            name: 'remove',
            aliases: ['unqueue'],
            group: 'pickups',
            memberName: 'remove',
            description: 'Unqueue from a pickup',
            guildOnly: true,
        });
    }

    async run(message) {
        run(message);
    }

};
module.exports.run = run;

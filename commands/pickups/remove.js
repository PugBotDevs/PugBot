const states = require('../../structures/Game').states;

const { updateCache } = require('../../libs/handlers');

const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');

let cache;
const run = async(message) => {
    let pickupsName;
    if (message.content.startsWith('-')) {
        if (message.content.indexOf(' ') >= 0) return message.reply('No pickups found!');
        pickupsName = message.content.substring(1);
        // if(pickupsName == '-')
    } else
        pickupsName = message.content.split(' ')[1];


    if (!pickupsName) return message.reply('No pickups found!');

    const pickupsChannel = cache.pickups[message.channel.id];
    if (!pickupsChannel) return;
    const pickups = pickupsChannel.find(x => { return x.name == pickupsName; });
    if (!pickups) return;
    const game = Object.values(pickups.games).find(x => { return x.state == states[0]; });
    if (!game) return;

    const res = game.removeMember(message.author.id);

    if (res) {
        message.reply(new MessageEmbed().setTitle('Succesfully remove from queue of ' + game.name).setDescription(`${game.size}/${game.maxSize} people in queue`).setColor('ORANGE').setFooter('ID: ' + game.id));
        updateCache(game, pickups, message.channel);
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
        cache = client.cache;
    }

    async run(message) {
        run(message);
    }

};
module.exports.run = run;

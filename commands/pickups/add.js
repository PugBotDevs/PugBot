const states = require('../../structures/Game').states;

const { readyHandler } = require('../../libs/handlers');
const { updateCache, getPickupChannel } = require('../../libs/utils');

const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');

let cache;

const run = async(message) => {
    let pickupsNames;
    if (message.content.startsWith('+')) {
        pickupsNames = message.content.substring(1).split(' ');
        if (pickupsNames[0] == '+')
            pickupsNames = 'all';
    } else
        pickupsNames = message.content.split(' ').splice(1);

    if (!pickupsNames) return message.reply('No pickups found!');

    const pickupsChannel = await getPickupChannel(message.channel.id);
    if (!pickupsChannel) return;
    let joined = new Array();

    if (pickupsNames instanceof Array) {
        pickupsNames.forEach(pickupsName => {
            const pickups = pickupsChannel.find(x => x.name == pickupsName);
            if (pickups) {
                let game = Object.values(pickups.games).find(x => x.state == states[0]);
                if (!game)
                    game = pickups.add(cache.pickupsCount[message.channel.id]);
                const res = game.addMember(message.author.id);
                if (res)
                    readyHandler(game, pickups, message.channel);
                joined.push(game);
                updateCache(game, pickups, message.channel);
            }
        });
    } else { // Join all games which are in queue
        joined = pickupsChannel.map(pickups => {
            const game = Object.values(pickups.games).find(x => x.state = states[0]);
            if (game) {
                const res = game.addMember(message.author.id);
                if (res)
                    readyHandler(game, pickups, message.channel);
                updateCache(game, pickups, message.channel);
                return game;
            }
            return void 0;
        });
        joined = joined.filter(x => x);
    }
    if (joined.length > 0) {
        const embed = new MessageEmbed().setColor('ORANGE');
        if (joined.length - 1) {
            embed.setTitle(`Successfully added to queues of ${joined.map(x => x.name).join(', ')}`);
            joined.forEach(game => {
                embed.addField(`${game.name}(${game.id})`, `${game.size}/${game.maxSize} people in queue`);
            });
        } else {
            embed.setTitle(`Succesfully added to queue of ${joined[0].name}`);
            embed.setDescription(`${joined[0].size}/${joined[0].maxSize} people in queue`);
        }
        message.reply(embed);
    }
};
module.exports = class command extends Command {

    constructor(client) {
        super(client, {
            name: 'add',
            aliases: ['queue'],
            group: 'pickups',
            memberName: 'add',
            description: 'Queue to a pickup',
            guildOnly: true,
        });
        cache = client.cache;
    }

    async run(message) {
        run(message);
    }

};
module.exports.run = run;

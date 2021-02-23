const states = require('../../structures/Game').states;

const {readyHandler, updateCache} = require('../../libs/handlers');

const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');
const db = require('../../db').channels;
const cache = require('../../app').cache;
const Pickups = require('../../structures/Pickups');

const run = async (message) => {
    let pickupsName;
    if (message.content.startsWith('+')) {
        if (message.content.indexOf(' ') >= 0 ) return message.reply('No pickups found!');
        pickupsName = message.content.substring(1);
        //if(pickupsName == '+')
    } else {
        pickupsName = message.content.split(' ')[1];
    }

    if(!pickupsName) return message.reply('No pickups found!');
    let pickupsChannel = cache.pickups[message.channel.id];
    if (!pickupsChannel) {
        pickupsChannel = await db.get(message.channel.id);
        if (typeof pickupsChannel == 'object' && pickupsChannel.arr) {
            pickupsChannel = pickupsChannel.arr
            cache.pickupsCount[message.channel.id] = pickupsChannel.count;
            pickupsChannel = pickupsChannel.map(pickups => {
                return new Pickups(pickups)
            })
            cache.pickups[message.channel.id] = pickupsChannel;
        }
        else pickupsChannel = undefined
    }
    if (!pickupsChannel) return;
    let pickups = pickupsChannel.find(x => x.name == pickupsName);
    if (!pickups) return message.reply('No pickups found with name '+ pickupsName +'\nDo !who to find list of pickups');
    let game = Object.values(pickups.games).find(x => x.state == states[0]);
    if (!game) {
        game = pickups.add(cache.pickupsCount[message.channel.id]);
    }
    const res = game.addMember(message.author.id);
    updateCache(game, pickups, message.channel)
    message.reply(new MessageEmbed().setTitle('Succesfully added to queue of '+game.name).setDescription(`${game.size}/${game.maxSize} people in queue`).setColor('ORANGE').setFooter('ID: '+game.id))
    if (res) {
        readyHandler(game, pickups, message.channel);
    }
}
module.exports = class command extends Command {
    constructor (client) {
        super(client, {
            name: 'add',
            aliases: ['queue'],
            group: 'pickups',
            memberName: 'add',
            description: 'Queue to a pickup',
            guildOnly: true
        })
    }
    async run (message) {
        run(message);
    }
}
module.exports.run = run
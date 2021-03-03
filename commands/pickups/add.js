const states = require('../../structures/Game').states;

const { readyHandler } = require('../../libs/handlers');

const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');

const run = async(message) => {
    let pickupsNames;
    if (message.content.startsWith('+')) {
        pickupsNames = message.content.substring(1).split(' ');
        if (pickupsNames[0] == '+')
            pickupsNames = 'all';
    } else
        pickupsNames = message.content.split(' ').splice(1);

    if (!pickupsNames) return message.reply('No pickups found!');

    let pugger = await message.client.puggers.fetch(message.author.id);
    if(!pugger) return message.reply('Couldn\'t resolve user!');

    let joined = new Array();
    
    if (pickupsNames instanceof Array) {
        for(let pickupName of pickupsNames) {
            let res = await pugger.queue(message.channel.id, pickupName);
            if(res){
                if(res.isFull) readyHandler(res.game, message.channel, message.client.pickups);
                joined.push(res.game);
            }
        }
    } else {
        let channel = await message.client.pickups.fetchChannel(message.channel.id);
        for(let { name } of channel){
            let res = await pugger.queue(message.channel.id, name);
            if(res){
                if(res.isFull) readyHandler(res.game, message.channel, message.client.pickups);
                joined.push(res.game);
            }
        };
    }

    // if (pickupsNames instanceof Array) {
    //     pickupsNames.forEach(pickupsName => {
    //         const pickups = pickupsChannel.find(x => x.name == pickupsName);
    //         if (pickups) {
    //             let game = Object.values(pickups.games).find(x => x.state == states[0]);
    //             if (!game) {
    //                 let count = message.client.pickups.count.get(message.channel.id);
    //                 if (!count) {
    //                     pickupsChannel.forEach(x => {
    //                         if (x.count > count) count = x.count;
    //                     });
    //                 }
    //                 if (!count) count = 1;
    //                 game = pickups.add(count);
    //             }
    //             const res = game.addMember(message.author.id);
    //             if (res)
    //                 readyHandler(game, pickups, message.channel, message.client.pickups);
    //             joined.push(game);
    //         }
    //     });
    // } else { // Join all games which are in queue
    //     joined = pickupsChannel.map(pickups => {
    //         const game = Object.values(pickups.games).find(x => x.state = states[0]);
    //         if (game) {
    //             const res = game.addMember(message.author.id);
    //             if (res)
    //                 readyHandler(game, pickups, message.channel, message.client.pickups);
    //             return game;
    //         }
    //         return void 0;
    //     });
    //     joined = joined.filter(x => x);
    // }

    // Send joined embed
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
    }

    async run(message) {
        run(message);
    }

};
module.exports.run = run;

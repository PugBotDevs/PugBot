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

    const pugger = await message.client.puggers.fetch(message.author);
    if (!pugger) return message.reply('Couldn\'t resolve user!');

    const joined = new Array();

    if (pickupsNames instanceof Array) {
        for (const pickupName of pickupsNames) {
            const res = await pugger.queue(message.channel, pickupName);
            if (res)
                joined.push(res.game);
        }
    } else {
        const channel = await message.client.pickups.fetchChannel(message.channel);
        for (const { name } of channel) {
            const res = await pugger.queue(message.channel.id, name);
            if (res) {
                if (res.isFull) res.game.readyHandler();
                joined.push(res.game);
            }
        }
    }

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
module.exports = {
    name: 'add',
    aliases: ['queue'],
    run,
};

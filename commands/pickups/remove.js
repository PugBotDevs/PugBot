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

    const pugger = await message.client.puggers.fetch(message.author);
    if (!pugger) return message.reply('Couldn\'t resolve user!');

    const left = new Array();
    if (pickupsNames instanceof Array) {
        for (const pickupName of pickupsNames) {
            const res = await pugger.unqueue(message.channel, pickupName);
            if (res) left.push(res);
        }
    } else {
        const channel = await message.client.pickups.fetchChannel(message.channel);
        for (const { name } of channel) {
            const res = await pugger.unqueue(message.channel, name);
            if (res) left.push(res);
        }
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
module.exports = {
    name: 'remove',
    aliases: ['unqueue'],
    description: ` - Remove from queue of pickups.
    - Usage: \`!remove [Pickup Name]\`
    - Quick Tip: use \`-[Pickup Name]\` or -- to leave all pickups queues.`,
    run,
};

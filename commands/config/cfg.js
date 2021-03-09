const { MessageEmbed } = require('discord.js');

const run = async(message, args) => {
    let config = '';

    if (args[0]) {
        const pickup = await message.client.pickups.fetch(message.channel, args[0]);
        if (!pickup) return message.channel.send(`Couldn't find pickup **'${args[0]}'**`);
        config = pickup.opts;
    } else {
        const channel = await message.client.db.channels.get(message.channel.id);
        if (!channel) return;
        config = channel.opts;
    }

    config = Object.entries(config).reduce((str, entry) => {
        if (entry[1] instanceof Array) return str += '\n' + entry[0] + ': ' + entry[1].join(' , ');
        return str += '\n' + entry[0] + ': ' + entry[1];
    }, '');

    message.author.send('', new MessageEmbed({
        title: `**Pickups Configuration for ${args[0] ? args[0] + ' @ ' : ''}${message.channel.name} (${message.guild.name})**`,
        description: '```haskell\n' + config + '```',
        color: 2526162,
    }));
};

module.exports = {
    name: 'cfg',
    aliases: [],
    run,
};

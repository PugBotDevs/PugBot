const run = async(message) => {
    const channel = await message.client.db.channels.get(message.channel.id);
    if (!channel) return;

    const config = Object.entries(channel.opts).reduce((str, entry) => {
        if (entry[1] instanceof Array) return str += '\n' + entry[0] + ': ' + entry[1].join(' , ');
        return str += '\n' + entry[0] + ': ' + entry[1];
    }, '');

    message.channel.send(`**Pickups Configuration for ${message.channel} (${message.guild.name})**` + config);
};

module.exports = {
    name: 'cfg',
    aliases: [],
    run,
};

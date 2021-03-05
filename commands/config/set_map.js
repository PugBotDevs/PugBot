const { errorEmbed, embed } = require('../../libs/utils');

const run = async(message, args = []) => {
    let maps;
    const channel = await message.client.db.channels.get(message.channel.id);
    if (!channel)
        return message.reply(errorEmbed('Pickups not configured in this channel yet!'));
    if (args.length === 1) {
        maps = args[0].split(',');
        if (!channel.opts) channel.opts = {};
        channel.opts.maps = maps;
    } else if (args.length === 2) {
        const pickups = args[0];
        maps = args[1].split(',');
        const pickup = channel.arr.find(x => x.name == pickups);
        pickup.opts.maps = maps;
    } else
        return message.reply(errorEmbed('Expected one or two arguments.\nEg: \n>>> !set_map Map1,Map2,Map3\n !set_map 2v2 Map1,Map2'));
    const set = await message.client.db.channels.set(message.channel.id, channel);
    if (set)
        return message.reply(embed('Succesfully set maps', `Maps of this channel set to ${maps.join(', ')}`, 'GREEN'));
    else
        return message.reply(errorEmbed('Database failed to set, contact bot developer if the issue persists.'));
};

module.exports = {
    name: 'set_map',
    aliases: ['set_maps'],
    run,
};

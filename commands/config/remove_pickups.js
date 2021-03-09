const run = async(message, args = '') => {
    if (!args || args.length != 1)
        return message.reply('I Need one argument (Pickups Name)');

    const name = args[0];
    const pickups = await message.client.pickups.removePickups(name, message.channel.id);
    if (pickups === true)
        return message.reply(`Successfully removed pickups: ${name}`);
    else if (typeof pickups === 'string')
        return message.reply(pickups);
    else
        return message.reply('ERR: UNKNOWN Command failed!');
};
module.exports = {
    name: 'remove_pickups',
    aliases: ['remp'],
    description: ` - Remove a pickups.
    - Usage: \`!remove_pickups [Pickups Name]\``,
    run,
};

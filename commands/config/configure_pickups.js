const { errorEmbed, embed } = require('../../libs/utils');
const settings = require('../../libs/settings');

const run = async(message, args = []) => {
    if (args.length < 1) return message.reply(errorEmbed('Expected one or more arguments!'));

    const pickups = args.shift().split(', ');

    const settingName = args.shift();
    const setting = settings[settingName];
    if (!setting) return message.reply(errorEmbed(`Did not find any configurable setting with name ${settingName}.\nTry one of \n${Object.keys(settings).join(', ')}`));

    if (args.length != setting.argLength) return message.reply(errorEmbed(`Expected ${setting.argLength} argument(s) for the setting ${settingName}..`));

    const channel = await message.client.db.channels.get(message.channel.id);
    if (!channel) return message.reply(errorEmbed('Pickups not configured in this channel!'));
    if (!channel.opts) channel.opts = {};

    if (!setting.boolean && setting.options) {
        args.forEach((arg, i) => {
            const options = Object.values(setting.options[i]);
            if (!options.includes(arg))
                return message.reply(errorEmbed(`Expected one of ${options.join(', ')}`));
        });
    }

    pickups.forEach(pickup => {
        const pickupFound = channel.arr.find(x => x.name == pickup);
        if (pickupFound) pickupFound.opts = setting.run(args, channel.opts);
        else return message.reply(`${pickup} was not found in this channel!`);
    });

    const set = await message.client.db.channels.set(message.channel.id, channel);
    if (set) return message.reply(embed(`Succesfully set ${settingName} for this channel`, `${settingName} of this channel set to ${args.join(' ')}`, 'GREEN'));
    else return message.reply(errorEmbed('Database failed to set, contact bot developer if the issue persists.'));
};

module.exports = {
    name: 'configure_pickups',
    aliases: ['config_pickup', 'set_pickups', 'set_pickup'],
    description: `- Configure settings for a specific pickups.
    - This overrides channel-wide settings.
    - Usage: \`!configure_pickups [Pickup Name] [Settings Name] [arg1] (additional args)\`
    - To see a list of settings names and options scroll to the last.`,
    run,
};

const { MessageEmbed } = require('discord.js');

const errorEmbed = (description) => (
    new MessageEmbed()
        .setTitle('ERROR Encountered!')
        .setDescription(description)
        .setColor('RED')
);

const sendEmbed = (title, description, color) => {
    const embed = new MessageEmbed()
        .setTitle(title);
    if (description)
        embed.setDescription(description);
    if (color)
        embed.setColor(color);
    else
        embed.setColor('GOLD');
    return embed;
};

const parseToBoolean = (x) => {
    x = x.toLowerCase();
    const truth = ['yes', 'true', '1', 'y'];
    return truth.includes(x);
};

module.exports = {
    errorEmbed,
    embed: sendEmbed,
    parseToBoolean,
};

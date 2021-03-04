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

module.exports = {
    errorEmbed,
    embed: sendEmbed,
};

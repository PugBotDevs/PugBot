const ts = require('ts-trueskill');
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


const combinations = (array, size) => {
    function p(t, i) {
        if (t.length === size) {
            result.push(t);
            return;
        }
        if (i + 1 > array.length)
            return;

        p(t.concat(array[i]), i + 1);
        p(t, i + 1);
    }

    const result = [];
    p([], 0);
    return result;
};

const shuffle = (array) => {
    let temp;
    for (let i = array.length - 1; i > 0; i--) {
        const j = ~~(Math.random() * (i + 1));
        temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
};
module.exports = {
    errorEmbed,
    embed: sendEmbed,
    parseToBoolean,
    combinations,
    shuffle,
};

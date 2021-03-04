const Game = require('../structures/Game');
const states = Game.states;
// eslint-disable-next-line no-unused-vars
const { MessageEmbed, TextChannel } = require('discord.js'), Pickups = require('../structures/Pickups');

const tick = '✅';
const no = '⛔';

const readyHandler = async(game, channel) => {
    const manager = game.client.pickups;
    const pickups = (await manager.fetchChannel(channel.id));

    if (game.members.length > game.maxSize) game.members = game.members.slice(0, game.maxSize + 1);
    game.notReadyMembers = Array.from(game.members);
    let string = refreshReadyState(game);
    channel.send(string).then(message => {
        message.react(tick).then(() => message.react(no));
        const filter = (reaction, user) => [tick, no].includes(reaction.emoji.name) && game.members.includes(user.id);
        const collector = message.createReactionCollector(filter, { time: game.opts.readyWait || 120000 });
        collector.on('collect', (r, u) => {
            if (r.emoji.name == tick) {
                // Remove user from not Ready
                game.notReadyMembers.splice(game.notReadyMembers.indexOf(u.id), 1);
                if (game.notReadyMembers.length > 0) {
                    string = refreshReadyState(game);
                    message.edit(string);
                } else {
                    game.ready();
                    message.delete();
                    matchMaker(game, channel, pickups);
                }
            } else if (r.emoji.name == no) {
                string = `Match was aborted by ${u}`;
                game.removeMember(u.id);
                game.notReadyMembers = [];
                game.queue();
                collector.stop('Aborted');
                message.edit(string);
                return false;
            }
        });
        collector.on('end', (coll, reason) => {
            reason = 'ended collection due to reason' + reason;
            reason;
            if (game.state == states[1]) {
                string = `${game.notReadyMembers.map(mem => `<@${mem}>`).join(',')} was(were) not ready in time`;
                message.edit(string);
                game.state = states[0];
                game.notReadyMembers.forEach(mem => {
                    game.removeMember(mem);
                });
            }
        });
    });
};

/**
 * Returns a ready state string with non-ready members for a game
 * @param {Game} game
 */
const refreshReadyState = (game) => {
    let string = `**Match ID: ${game.id}**\n**${game.name}** pickups is now in waiting ready state!\n`;
    string += `Waiting for ${game.notReadyMembers.map(mem => `<@${mem}>`).join(',')}\nPlease react with :white_check_mark: to **check-in** or :no_entry: to **abort**!`;
    return string;
};

/**
 * Initiates match making for a game
 * @param {Game} game
 * @param {Pickups} pickups
 * @param {TextChannel} channel
 */
const matchMaker = (game, channel, pickupsChannel) => {
    if (game.members.length == 2) {
        game.teams.alpha.push(game.members[0]);
        game.teams.beta.push(game.members[1]);
    } else {
        switch (game.opts.pick) {
        case 'AUTO': {
            // Make a new array from game.members instead of refering it and then shuffle it
            const unpicked = shuffle(Array.from(game.members));
            // Split the shuffled into two arrays and assign to alpha and beta
            [game.teams.alpha, game.teams.beta ] = new Array(Math.ceil(unpicked.length / 2))
                .fill()
                .map(() => unpicked.splice(0, 2));
        }
        }
    }
    if (game.teams.alpha.length && game.teams.beta.length) {
        const embed = new MessageEmbed()
            .setTitle('TEAMS READY!')
            .setColor('RED')
            .setDescription(`${game.teams.alpha.map(mem => `<@${mem}>`).join(',')}\n        **VERSUS**\n${game.teams.beta.map(mem => `<@${mem}>`).join(',')}`);
        const maps = pickupsChannel.find(x => x.name == game.name)?.opts?.maps;
        if (maps) {
            // Select a psuedorandom map
            const map = maps[~~(Math.random() * maps.length)];
            embed.addField('Suggested Map: ', map);
        }
        return channel.send(game.members.map(mem => `<@${mem}>`).join(','), { embed }).catch(console.log);
    } else
        channel.send('Failed to matchmake!');
};


module.exports = {
    readyHandler,
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

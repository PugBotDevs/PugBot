const states = ['QUEUE', 'READY', 'PROGRESS', 'DONE'];
class Game {

    constructor(client, pickups, id) {
        this.client = client;
        this.pickups = pickups;
        this.name = pickups.name;
        this.maxSize = pickups.size;
        this.size = 0;
        this.opts = pickups.opts;
        this.channel = pickups.channel;
        this.state = states[0];
        this.id = id;
        this.members = [];
        this.notReadyMembers = [];
        this.teams = {
            alpha: [],
            beta: [],
        };
        return this;
    }

    /**
     * @param  {String} Member ID
     * @returns {Boolean} True if game is full and false if game is not full
     */
    addMember(member) {
        this.members.push(member);
        this.size += 1;
        if (this.members.length >= this.maxSize) {
            this.notReadyMembers = this.members;
            readyHandler(this);
            return true;
        } else
            return false;
    }

    /**
     * @param  {String} Member ID
     * @returns {Boolean} True if member is found
     */
    removeMember(member) {
        const index = this.members.indexOf(member);
        if (index >= 0) {
            this.members.splice(index, 1);
            this.size -= 1;
            return true;
        } else
            return false;
    }

    /**
     * Changes the state of the game to queue state
     */
    setQueue() {
        this.state = states[0];
        return this;
    }

    /**
     * Changes the state of the game to ready wait
     */
    setReadyWait() {
        this.state = states[1];
        return this;
    }

    /**
     * Changes the state of the game to progress (Match is ongoing)
     */
    setOngoing() {
        this.state = states[2];
    }

    /**
     * Changes the state of match to done
     */
    setDone() {
        this.state = states[3];
    }

    get states() {
        return states;
    }

}

module.exports = Game;
module.exports.states = states;

// eslint-disable-next-line no-unused-vars
const { MessageEmbed, TextChannel } = require('discord.js'), Pickups = require('../structures/Pickups');

const tick = '✅';
const no = '⛔';

const readyHandler = async(game) => {
    const manager = game.client.pickups;
    const pickups = (await manager.fetchChannel(game.channel));

    game.setReadyWait();
    if (game.members.length > game.maxSize) game.members = game.members.slice(0, game.maxSize + 1);
    game.notReadyMembers = Array.from(game.members);
    let string = refreshReadyState(game);
    game.channel.send(string).then(message => {
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
                    game.setOngoing();
                    message.delete();
                    matchMaker(game, pickups);
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
                game.queue();
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
const matchMaker = (game, pickupsChannel) => {
    const pickup = pickupsChannel.find(x => x.name == game.name);
    if (pickup.opts.team) {
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
                .setTitle('${game.name} has started\nTEAMS READY!')
                .setColor('GOLD')
                .setDescription(`Players: \n${game.teams.alpha.map(mem => `<@${mem}>`).join(',')}\n        **VERSUS**\n${game.teams.beta.map(mem => `<@${mem}>`).join(',')}`);
            addMap(embed, pickup);
            game.channel.send(game.members.map(mem => `<@${mem}>`).join(','), { embed }).catch(console.log);
        } else
            return game.channel.send('Failed to matchmake!');
    } else {
        const embed = new MessageEmbed()
            .setTitle(`${game.name} has started`)
            .setColor('GOLD')
            .setDescription(`Players: \n${game.members.map(mem => `<@${mem}>`).join(', ')}`);
        addMap(embed, pickup);
        game.channel.send(game.members.map(mem => `<@${mem}>`).join(','), { embed });
    }
    if (pickup.opts.ranked) waitReport(game);
    else game.setDone();
};
const waitReport = async(game) => {
    game.setOngoing();
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

const addMap = (embed, pickup) => {
    const maps = pickup.opts.maps;
    if ((maps || []).length) {
        // Select a psuedorandom map
        const map = maps[~~(Math.random() * maps.length)];
        embed.addField('Suggested Map: ', map);
    }
    return embed;
};

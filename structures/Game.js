const ts = require('ts-trueskill');
const matchMakers = require('../libs/matchmakers');
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
        this.captains = [];
        this.map = this.opts.maps?.[~~(Math.random() * this.opts.maps.length)];
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
        const index = this.members.map(x => x.id).indexOf(member);
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

    async report(scores) {
        // Implementation from https://gitlab.com/eternalFPS/PUBobot-discord/-/blob/9b848a8fe3df2c4d815458c2f9a0145048090c97/modules/stats3.py
        // naming scheme is g prefix for 'global elo' used for matchmaking
        const ratings = {
            alpha: this.teams.alpha.map(x => new ts.Rating(x.elo(this.channel.id).rank, x.elo(this.channel.id).sigma)),
            beta: this.teams.beta.map(x => new ts.Rating(x.elo(this.channel.id).rank, x.elo(this.channel.id).sigma)),
            g: {
                alpha: this.teams.alpha.map(x => new ts.Rating(x.elo().rank, x.elo().sigma)),
                beta: this.teams.alpha.map(x => new ts.Rating(x.elo().rank, x.elo().sigma)),
            },
            new: {
                g: {},
            },
        };

        // For incorrectly predicted games
        const gWinProb = [0, 0], winProb = [0, 0];
        gWinProb[0] = ts.gWinProbability(ratings.alpha, ratings.beta);
        gWinProb[1] = ts.gWinProbability(ratings.beta, ratings.alpha);
        winProb[0] = ts.gWinProbability(ratings.g.alpha, ratings.g.beta);
        winProb[1] = ts.gWinProbability(ratings.g.beta, ratings.g.alpha);

        // Normal use case
        [ratings.new.alpha, ratings.new.beta] = ts.rate([ratings.alpha, ratings.beta], scores);
        [ratings.new.g.alpha, ratings.g.alpha ] = ts.rate([ratings.globalAlpha, ratings.globalBeta], scores);
        const Promises = [];
        this.ratingChange = [];
        this.members.forEach(player => {
            const teams = ['alpha', 'beta'];
            let teamNum;
            if (this.teams.alpha.includes(player)) teamNum = 0;
            else teamNum = 1;
            const team = teams[teamNum];
            const
                Ratings = ratings[team].find(x => x.id == player.id),
                GRatings = ratings.g[team].find(x => x.id == player.id),
                newRatings = ratings.new[team].find(x => x.id == player.id),
                newGRatings = ratings.new.g[team].find(x => x.id == player.id),
                gRankNew = newRatings.mu,
                rankNew = newGRatings.mu,
                is_winner = 1 - scores[teamNum],
                gRankDiff = gRankNew - Ratings.mu,
                rankDiff = rankNew - GRatings.mu;
            let
                gSigNew = newRatings.sigma,
                gSigDiff = gSigNew - Ratings.sigma,
                sigNew = newGRatings.sigma,
                sigDiff = sigNew - GRatings.sigma;
            // Adjusting Sigma Values
            if ((is_winner == 1 && gWinProb[teamNum] < gWinProb[1 - teamNum]) || (is_winner == 0 && gWinProb[teamNum] > gWinProb[1 - teamNum])) {
                gSigNew = gSigNew - (2 - gWinProb[teamNum]) * gSigDiff;
                gSigDiff = gSigNew - Ratings.sigma;
            }
            if ((is_winner == 1 && winProb[teamNum] < winProb[1 - teamNum]) || (is_winner == 0 && winProb[teamNum] > winProb[1 - teamNum])) {
                sigNew = sigNew - (2 - winProb[teamNum]) * sigDiff;
                sigDiff = sigNew - GRatings.sigma;
            }

            player.updateElo({
                rank: gRankNew,
                sigma: gSigNew,
            }, this.channel.id);

            player.updateElo({
                rank: rankNew,
                sigma: sigNew,
            });

            Promises.push(player.updateDB);
            this.ratingChange.push({
                local: gRankDiff,
                global: rankDiff,
            });
        });
        // Execute all pugger updates asynchronously, reduces time to taken to update ridiculously
        await Promise.all(Promises);
        return this;
    }

    tryReportLoss(pugger) {
        const index = this.captains.indexOf(pugger);
        if (index == 0) {
            // Alpha has reported loss
            return this.report([1, 0]);
        } else if (index == 1) {
            // Beta has reported loss
            return this.report([0, 1]);
        } else return 'Only captains can report loss';
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
    game.notReadyMembers = Array.from(game.members.map(x => x.id));
    let string = refreshReadyState(game);
    game.channel.send(string).then(message => {
        message.react(tick).then(() => message.react(no));
        const filter = (reaction, user) => [tick, no].includes(reaction.emoji.name) && game.members.map(x => x.id).includes(user.id);
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
const matchMaker = async(game) => {
    const pickup = game.pickups;
    console.log(pickup.opts);
    if (pickup.opts.team) {
        if (game.members.length == 2) {
            game.teams.alpha.push(game.members[0].id);
            game.teams.beta.push(game.members[1].id);
        } else {
            switch (game.opts.pick) {
            case 'AUTO': {
                await matchMakers.auto(game);
                break;
            }
            default: {
                await matchMakers.auto(game);
            }
            }
        }
        if (game.teams.alpha.length && game.teams.beta.length) {
            game.teams.alpha.sort((a, b) => a.globalElo - b.globalElo);
            game.teams.beta.sort((a, b) => a.globalElo - b.globalElo);

            // Pick captains with highest elo ranking.
            game.captains = [game.teams.alpha[0], game.teams.beta[0]];
            const embed = new MessageEmbed()
                .setTitle(`${game.name} has started\nTEAMS READY!`)
                .setColor('GOLD')
                .setDescription(`Players: \n${game.teams.alpha.map(mem => `<@${mem}>`).join(',')}\n        **VERSUS**\n${game.teams.beta.map(mem => `<@${mem}>`).join(',')}`);
            addMap(embed, pickup);
            game.channel.send(game.members.map(mem => `<@${mem.id}>`).join(','), { embed }).catch(console.log);
        } else
            return game.channel.send('Failed to matchmake!');
    } else {
        const embed = new MessageEmbed()
            .setTitle(`${game.name} has started`)
            .setColor('GOLD')
            .setDescription(`Players: \n${game.members.map(mem => `<@${mem.id}>`).join(', ')}`);
        addMap(embed, game);
        game.channel.send(game.members.map(mem => `<@${mem.id}>`).join(','), { embed });
    }
    if (pickup.opts.ranked) waitReport(game);
    else game.setDone();
};
const waitReport = async(game) => {
    game.setOngoing();
};

const addMap = (embed, game) => {
    if (game.map)
        embed.addField('Suggested Map: ', game.map);
    return embed;
};

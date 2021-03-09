const ts = require('ts-trueskill');
const matchMakers = require('../libs/matchmakers');

// eslint-disable-next-line no-unused-vars
const { MessageEmbed, TextChannel } = require('discord.js'), Pickups = require('../structures/Pickups');

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
            toPuggers: () => {
                const alpha = this.teams.alpha.map(uid => this.members.find(p => p.id == uid));
                const beta = this.teams.beta.map(uid => this.members.find(p => p.id == uid));
                return { alpha, beta };
            },
        };
        this.captains = [];
        this.map = this.opts.maps?.[~~(Math.random() * this.opts.maps.length)];
        this.winner = -1;
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
        this.members.forEach(member => {
            member.queued.splice(member.queued.indexOf(this), 1);
            member.setGame(this);
            member.queued.forEach(game => {
                member.unqueue(game.channel, game.name);
            });
        });
        return this;
    }

    /**
     * Changes the state of the game to progress (Match is ongoing)
     */
    setOngoing() {
        this.members.forEach(pugger => {
            pugger.queued = [];
            pugger.game = this;
        });
        this.state = states[2];
        this.members.forEach(x => {
            x.setGame(this);
        });
    }

    /**
     * Changes the state of match to done
     */
    setDone() {
        this.members.forEach(pugger => pugger.game = null);
        this.state = states[3];
        if (this.opts.ranked) {
            const embed = new MessageEmbed({ title: `Match ${this.name}(${this.id}) has ended`, color: 'GREEN' });
            if (this.winner == 1 || this.winner == 0) embed.setDescription(`Match has been won by ${['alpha', 'beta'][this.winner]} team`); // Change Alpha-Beta to configured teamname;
            else if (this.winner == 2) embed.setDescription('Ended in a draw');
            if (this.winner == -1) embed.setDescription('Match was cancelled').setColor('RED');
            if (this.ratingChange.length == this.members.length) {
                this.members.forEach((member, i) => {
                    const rank = member.getElo(this.channel.id).rank?.toFixed(3);
                    const gRank = member.getElo().rank?.toFixed(3);
                    embed.addField(member.user.username, `Seasonal Elo: ${ (rank - this.ratingChange[i].local)?.toFixed(3)} --> ${ rank } (${this.ratingChange[i].local?.toFixed(3)})\nAll-time Elo: ${ (gRank - this.ratingChange[i].global)?.toFixed(3)} --> ${ gRank } (${this.ratingChange[i].global?.toFixed(3)})`);
                });
            }
            this.channel.send(embed);
        }
    }

    get states() {
        return states;
    }

    async report(scores) {
        this.parseScore(scores);
        const teams = ['alpha', 'beta'];
        // Implementation from https://gitlab.com/eternalFPS/PUBobot-discord/-/blob/9b848a8fe3df2c4d815458c2f9a0145048090c97/modules/stats3.py
        // naming scheme is g prefix for 'global elo' used for matchmaking
        const ratings = {
            alpha: this.teams.alpha.map(x => new ts.Rating(x.getElo(this.channel.id).rank, x.getElo(this.channel.id).sigma)),
            beta: this.teams.beta.map(x => new ts.Rating(x.getElo(this.channel.id).rank, x.getElo(this.channel.id).sigma)),
            g: {
                alpha: this.teams.alpha.map(x => new ts.Rating(x.getElo().rank, x.getElo().sigma)),
                beta: this.teams.alpha.map(x => new ts.Rating(x.getElo().rank, x.getElo().sigma)),
            },
            new: {
                g: {},
            },
        };

        // For incorrectly predicted games
        const gWinProb = [0, 0], winProb = [0, 0];
        gWinProb[0] = ts.winProbability(ratings.alpha, ratings.beta);
        gWinProb[1] = ts.winProbability(ratings.beta, ratings.alpha);
        winProb[0] = ts.winProbability(ratings.g.alpha, ratings.g.beta);
        winProb[1] = ts.winProbability(ratings.g.beta, ratings.g.alpha);

        // Normal use case
        [ratings.new.alpha, ratings.new.beta] = ts.rate([ratings.alpha, ratings.beta], scores);
        [ratings.new.g.alpha, ratings.new.g.beta ] = ts.rate([ratings.g.alpha, ratings.g.beta], scores);
        const Promises = [];
        this.ratingChange = [];
        this.members.forEach(player => {
            let teamNum;
            if (this.teams.alpha.includes(player)) teamNum = 0;
            else teamNum = 1;
            const team = teams[teamNum];
            const index = this.teams[team].findIndex(x => x.id == player.id);
            const
                Ratings = ratings[team][index],
                GRatings = ratings.g[team][index],
                newRatings = ratings.new[team][index],
                newGRatings = ratings.new.g[team][index],
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

            Promises.push(player.updateDB());
            this.ratingChange.push({
                local: gRankDiff,
                global: rankDiff,
            });
        });
        // Execute all pugger updates asynchronously, reduces time to taken to update ridiculously
        await Promise.all(Promises);
        this.setDone();
        return this;
    }

    tryReportLoss(pugger) {
        if (this.state !== states[2]) return 'Match is not in reporting stage yet!';
        const index = this.captains.indexOf(pugger);
        if (index == 0) {
            // Alpha has reported loss
            return this.report([1, 0]);
        } else if (index == 1) {
            // Beta has reported loss
            return this.report([0, 1]);
        } else return 'Only captains can report loss';
    }

    parseScore(score) {
        if (score[0] == 1) this.winner = 1;
        else if (score[1] == 1) this.winner = 0;
        else this.winner = 2; // draw
    }

}

module.exports = Game;
module.exports.states = states;

const tick = '✅';
const no = '⛔';

const readyHandler = async(game) => {
    game.setReadyWait();
    if (!game.opts.check_in) return matchMaker(game);

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
                    matchMaker(game);
                }
            } else if (r.emoji.name == no) {
                string = `Match was aborted by ${u}`;
                game.removeMember(u.id);
                game.notReadyMembers = [];
                game.setQueue();
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
                game.setQueue();
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
    if (pickup.opts.team) {
        if (game.members.length == 2) {
            game.teams.alpha.push(game.members[0]);
            game.teams.beta.push(game.members[1]);
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
                .setDescription(`Players: \n${game.teams.alpha.map(mem => `<@${mem.id}>`).join(',')}\n        **VERSUS**\n${game.teams.beta.map(mem => `<@${mem.id}>`).join(',')}`);
            addMap(embed, pickup);
            game.channel.send(game.members.map(mem => `<@${mem.id}>`).join(','), { embed });
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
    if (pickup.opts.ranked) game.setOngoing();
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

const addMap = (embed, game) => {
    if (game.map)
        embed.addField('Suggested Map: ', game.map);
    return embed;
};

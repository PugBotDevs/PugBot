const states = require('../structures/Game').states;

const {MessageEmbed} = require('discord.js');

const pCache = require('../app').cache.pickups;
pCache;
const tick = '✅';
const no = '⛔';
const readyHandler = async(game, pickups, channel) => {
    if (game.members.length > game.maxSize) game.members = game.members.slice(0, game.maxSize+1);
    game.notReadyMembers = game.members
    let string = refreshReadyState(game);
    channel.send(string).then( message => {
        message.react(tick).then(()=>message.react(no));
        const filter = (reaction, user) => {
            return [tick,no].includes(reaction.emoji.name) && game.members.includes(user.id)
        }
        const collector = message.createReactionCollector(filter, { time: game.opts.readyWait || 120000});
        collector.on('collect', (r, u)=>{
            console.log('COLELCTION', r.emoji.name, u.username)
            if (r.emoji.name == tick) {
                // Remove user from not Ready
                game.notReadyMembers = game.notReadyMembers.splice(game.notReadyMembers.indexOf(u.id),1);
                if (game.notReadyMembers.length > 0) {
                    string = refreshReadyState(game);
                    message.edit(string);
                } else {
                    game.ready();
                    updateCache(game, pickups, channel);
                    message.delete();
                    matchMaker(game, pickups, channel);
                }
            } else if (r.emoji.name == no) {
                string = `Match was aborted by ${u}`
                game.removeMember(u.id);
                game.notReadyMembers = [];
                game.queue();
                collector.stop('Aborted');
                updateCache(game, pickups, channel);
                message.edit(string);
                return false;
            }
        })
        collector.on('end', (coll, reason) => {
            console.log('ended collection due to reason', reason)
            if (game.state == states[1]) {
                string = `${game.notReadyMembers.map(mem => `<@${mem}>`).join(',')} was(were) not ready in time`
                message.edit(string);
                game.state = states[0];
                game.notReadyMembers.forEach(mem => {
                    game.removeMember(mem)
                })
                updateCache(game, pickups, channel);
            }
        })
    });
}
const refreshReadyState = (game) => {
    let string = `**Match ID: ${game.id}**\n**${game.name}** pickups is now in waiting ready state!\n`;
    string += `Waiting for ${game.notReadyMembers.map(mem => `<@${mem}>`).join(',')}\nPlease react with :white_check_mark: to **check-in** or :no_entry: to **abort**!`
    return string;
}

const matchMaker = (game, pickups, channel) => {
    console.log('making match')
    if (game.members.length == 2) {
        game.teams.alpha = game.members[0];
        game.teams.beta = game.members[1];
    } else {
        switch (game.opts.pick) {
            case 'AUTO': {
                const unpicked = new Array(game.members);
                while (unpicked.length > 1){
                    game.teams.alpha.append(unpicked.pop(Math.random()*(unpicked.length-1)))
                    game.teams.beta.append(unpicked.pop(Math.random()*(unpicked.length-1)))
                }
                if (unpicked.length){
                    game.teams.alpha.append(unpicked.pop(0))
                }   
            }
        }
    }
    if (game.teams.alpha.length && game.teams.beta.length) {
        channel.send(game.members.map(mem => `<@${mem}>`).join(','))
        channel.send(new MessageEmbed()
            .setTitle('TEAMS READY!')
            .setDescription(`${game.teams.alpha.map(mem => `<@${mem}>`).join(',')}\n\t\tVERSUS\n${game.teams.beta.map(mem => `<@${mem}>`).join(',')}`)
        )
    } else {
        channel.send('Failed to matchmake!')
    }
    
}

const updateCache = (game, pickups, channel) => {
    pickups.games[game.id] = game;
    pCache[channel.id][pickups.name] = pickups;
}
module.exports = {
    readyHandler,
}
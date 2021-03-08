const run = async(message) => {
    const pugger = await message.client.puggers.fetch(message.author);
    if (!(pugger.game && pugger.game.state == pugger.game.states[2])) return message.channel.send('No active match found!');

    const teams = pugger.game.teams;
    teams.alpha.avgElo = teams.alpha.reduce((s, p) => s += p.elo.rank, 0) / teams.alpha.length;
    teams.beta.avgElo = teams.beta.reduce((s, p) => s += p.elo.rank, 0) / teams.beta.length;

    const str = teams.alpha.map(p => '`' + p.user.username + '`').join(' + ') + ` (${teams.alpha.avgElo})` + '\n **VERSUS** \n' + teams.beta.map(p => '`' + p.user.username + '`').join(' + ') + ` (${teams.beta.avgElo})`;
    message.channel.send(str);
};

module.exports = {
    name: 'teams',
    aliases: [],
    description: ` - Lists the teams of the player's current match.
     - Usage: !teams`,
    run,
};

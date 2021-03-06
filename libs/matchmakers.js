const { combinations, shuffle } = require('../libs/utils');
const ts = require('ts-trueskill');
const auto = async(game) => {
    if (game.opts.ranked) {
        let bestQuality = 0;
        // trueskill!
        for (const t1 of combinations(game.members, Math.ceil(game.members.length / 2))) {
            const t2 = game.members.filter(x => !t1.includes(x));
            const rate = x => new ts.Rating(x.elo.rank, x.elo.signum);
            const t1ratings = t1.map(rate), t2ratings = t2.map(rate);
            console.log(t1ratings);
            const quality = ts.quality([t1ratings, t2ratings]);
            if (quality > bestQuality) {
                bestQuality = quality;
                game.teams.alpha = new Array(...t1);
                game.teams.beta = new Array(...t2);
            }
        }
    } else {
        // Make a new array from game.members instead of refering it and then shuffle it
        const unpicked = shuffle(Array.from(game.members.map(x => x.id)));
        // Split the shuffled into two arrays and assign to alpha and beta
        [game.teams.alpha, game.teams.beta ] = new Array(Math.ceil(unpicked.length / 2))
            .fill()
            .map(() => unpicked.splice(0, 2));
    }
};

module.exports = {
    auto,
};

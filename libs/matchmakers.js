const { combinations, shuffle } = require('../libs/utils');
const ts = require('ts-trueskill');
const auto = async(game) => {
    if (game.opts.ranked) {
        let bestQuality = 0;
        // trueskill!
        // Add indexed ids
        game.members.map((x,i) => {
            x.index_id = `${i}_${x.id}`;
            return x;
        });
        for (let t1 of combinations(game.members, Math.ceil(game.members.map(x => x.index_id).length / 2))) {
            let t2 = game.members.map(x => x.index_id).filter(x => !t1.includes(x));
            t1 = t1.map(x => game.members.find(y => y.index_id == x));
            t2 = t2.map(x => game.members.find(y => y.index_id == x));
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

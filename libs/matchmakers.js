const { combinations, shuffle } = require('../libs/utils');

const auto = async(game) => {
    if (game.opts.ranked) {
        const combos = combinations(game.members.map(x => x.id), Math.ceil(game.members.length / 2));
        for (const c of combos) {
            // c
            console.log(c);
        }
        // noob
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

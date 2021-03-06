const arr = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const { getPermutations } = require('../libs/utils');


const teams = getPermutations(arr, arr.length / 2);
for (const alpha of teams) {
    const beta = arr.filter(x => !alpha.includes(x));

    
}


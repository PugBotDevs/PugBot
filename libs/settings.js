const { parseToBoolean } = require('./utils');
const teams = {
    boolean: true,
    argLength: 1,
};

const ranked = {
    boolean: true,
    argLength: 1,
};

const maps = {
    argLength: 1,
    run: (args, opts) => {
        opts.maps = args[0].split(',');
        return opts;
    },
};
const check_in = {
    boolean: true,
    argLength: 1,
};
// returns a function which can be executed by config command;
const booleanExec = (key) => (args, opts) => {
    const option = args[0];
    opts[key] = parseToBoolean(option);
    return opts;
};

const settings = {
    teams,
    ranked,
    maps,
    check_in,
};
Object.entries(settings).forEach((([k, v]) => {
    if (v.boolean) settings[k].run = booleanExec(k);
}));

module.exports = settings;

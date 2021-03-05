const { parseToBoolean } = require('./utils');
const team = {
    boolean: true,
    argLength: 1,
};

const ranked = {
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
    team,
    ranked,
};

Object.entries(settings).forEach((([k, v]) => {
    if (v.boolean) settings[k].run = booleanExec(k);
}));

module.exports = settings;

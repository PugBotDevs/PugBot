require('dotenv').config();

const { CommandoClient } = require('discord.js-commando');
const path = require('path');
const cache = {
    pickups: {},
    pickupsCount: {},
};
const client = new CommandoClient({
    owner: ['685361423001452576'], // Your ID here.
    commandPrefix: '!', // The prefix of your bot.
    unknownCommandResponse: false, // Set this to true if you want to send a message when a user uses the prefix not followed by a command
});
require('./db').init();
module.exports.cache = cache;
client.registry
    .registerDefaultTypes()
    .registerGroups([
        ['pickups', 'All basic commands relating to pickups'],
    ])
    .registerDefaultGroups()
    .registerDefaultCommands()
    .registerCommandsIn(path.join(__dirname, 'commands'));
client.once('ready', () => {
    console.log('LOGGED IN!');
});
client.on('error', console.error);

client.on('commandError', (command, err) => {
    console.error(err);
});
const add = require('./commands/pickups/add');
client.on('message', (message) => {
    if (message.content.startsWith('+'))
        add.run(message);
});
const env = process.env.NODE_ENV || 'TEST';
let token;
if (env.toUpperCase() == 'PRODUCTION')
    token = process.env.TOKEN;
else
    token = process.env.TEST;


client.login(token);

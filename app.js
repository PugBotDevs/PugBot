require('dotenv').config();

const PugClient = require('./structures/PugClient');
const path = require('path');

const client = new PugClient({
    owner: ['582054452744421387', '685361423001452576', '518097896365752338', '429493473259814923'], // Your ID here.
    commandPrefix: '!', // The prefix of your bot.
    unknownCommandResponse: false, // Set this to true if you want to send a message when a user uses the prefix not followed by a command
});

client.once('ready', () => {
    console.log('LOGGED IN!');
    client.registry
        .registerDefaultTypes()
        .registerGroups([
            ['pickups', 'All basic commands relating to pickups'],
        ])
        .registerDefaultGroups()
        .registerDefaultCommands()
        .registerCommandsIn(path.join(__dirname, 'commands'));
});

client.on('error', console.error);

client.on('commandError', (command, err) => {
    console.error(err);
});


const env = process.env.NODE_ENV || 'TEST';
const token = (env.toUpperCase() == 'PRODUCTION') ? process.env.TOKEN : process.env.TEST;


(async function main() {
    await require('./db').init(client);
    module.exports = client;

    client.login(token);

    const add = require('./commands/pickups/add');
    const remove = require('./commands/pickups/remove');
    client.on('message', (message) => {
        if (message.content.startsWith('+'))
            add.run(message);
        if (message.content.startsWith('-'))
            remove.run(message);
    });
})();

require('dotenv').config();

const PugClient = require('./structures/PugClient');
const path = require('path');

const client = new PugClient({
    owner: ['582054452744421387', '685361423001452576', '518097896365752338', '429493473259814923'],
    prefix: '!',
});

client.once('ready', () => {
    console.log('LOGGED IN!');
    client.register(path.join(__dirname, 'commands'));
});

client.on('error', console.error);

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

/* eslint-disable no-unused-vars */
module.exports = {};
const DatabaseClient = require('./structures/Database');
module.exports.init = async() => {
    const Client = new DatabaseClient();
    const channels = Client.createDatabase(process.env.DB_NAME || 'base', 'channels', 'channels');

    Client.connect().then(() => {
        console.log('DB CONNECTED');
    });
    module.exports = Client;
};

/* eslint-disable no-unused-vars */
const DatabaseClient = require('./structures/Database');
module.exports.DatabaseClient = DatabaseClient;
module.exports.init = async(client) => {
    const Client = new DatabaseClient();
    const channels = Client.createDatabase(process.env.DB_NAME || 'base', 'channels');
    const users = Client.createDatabase(process.env.DB_NAME || 'base', 'users');
    await Client.connect();
    console.log('DB CONNECTED');
    client.db = Client;
};

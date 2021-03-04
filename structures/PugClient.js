const fs = require('fs');
const { Client, Collection } = require('discord.js');
const PickupsManager = require('./PickupsManager');
const PuggerManager = require('./PuggerManager');

class PugClient extends Client {

    constructor(options) {
        super();
        const { owners, prefix } = options;
        this.owners = owners;
        this.prefix = prefix;

        this.commands = new Collection();
        this.aliases = new Collection();
        this.modules = new Array();

        this.pickups = new PickupsManager(this);
        this.puggers = new PuggerManager(this);
        return this;
    }

    async connectDB() {
        await require('../db').init(this);
        return this.db;
    }

    async register(path) {
        const folders = fs.readdirSync(path);
        folders.forEach((dir) => {
            if (fs.lstatSync(require('path').join(path, dir)).isDirectory()) {
                this.modules.push(path);
                const commands = fs.readdirSync(require('path').join(path, dir));
                commands.forEach(commandPath => {
                    try {
                        const command = require(require('path').join(path, dir, commandPath));
                        if (command.name) {
                            this.commands.set(command.name, command);
                            command.aliases.forEach(alias => this.aliases.set(alias, command.name));
                        }
                    } catch (error) {
                        console.error(`Failed to load command: ${commandPath}\n${error.stack || error}`);
                    }
                });
            }
        });
        this.on('message', (message) => {
            if (message.author.bot || !message.guild) return;
            const prefix = this.prefix;

            if (message.content.startsWith(prefix)) {
                const args = message.content.substring(prefix.length).split(' ');
                let command = args.shift().toLowerCase();

                if (command) {
                    command = this.commands.get(command) || this.commands.get(this.aliases.get(command));
                    if (command)
                        command.run(message, args);
                }
            }
        });
    }

}

module.exports = PugClient;

const { CommandoClient } = require("discord.js-commando");
const PickupsManager = require("./PickupsManager");
const PuggerManager = require("./PuggerManager");

class PugClient extends CommandoClient {
    constructor(options){
        super(options);
        this.pickups = new PickupsManager(this);
        this.puggers = new PuggerManager(this);
        return this;
    }

    async connectDB(){
        await require("../db").init(this);
        return this.db;
    }
}
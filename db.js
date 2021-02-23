const DB = {};
module.exports = DB
const Database = require('./structures/Database');
module.exports.init = async() => {
    const base = new Database('base');
    DB.base = base;
    module.exports = DB;
};

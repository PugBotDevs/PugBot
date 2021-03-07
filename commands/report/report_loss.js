const { errorEmbed } = require('../../libs/utils');

const run = async(message, args) => {
    const pugger = await message.client.puggers.fetch(message.author);
    if (!pugger) return;
    if (!pugger.game) return message.reply(errorEmbed('You are not in any active game that requires reporting!'));
    const tryReport = await pugger.game.tryReportLoss(pugger);
    if (typeof tryReport !== 'string')
        console.log(tryReport);
    else message.reply(errorEmbed(tryReport));
};
module.exports = {
    name: 'report_loss',
    aliases: ['rl'],
    run,
};

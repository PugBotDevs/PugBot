/*
*
*
* made by EwasTaken#3961 , dm for questions and stuff :D
*
*
*
*/
const { MessageEmbed } = require('discord.js');
const { Menu } = require('discord.js-menu');
const fs = require('fs');
const path = require('path');
const run = (message) => {
    const pages = new Array();
    message.client.modules.forEach((module, index) => {
        let description;
        try {
            description = fs.readFileSync(path.join(__dirname, '..', module, 'info.md'));
        } catch (e) {
            // do nothing
        }
        const page = {
            name: `${module} - ${index + 2}`,
            content: new MessageEmbed({
                title: module,
                description: description || '\u200B',
                fields: message.client.commands.filter(x => x.module == module).map(x => ({
                    name: x.name,
                    value: x.description,
                })),
            }),
        };
        pages.push(page);
    });
    pages.forEach((page, index) => {
        const reactions = {
            '◀️': 'previous',
            '▶️': 'next',
            '🗑️': 'delete',
        };
        if (pages[index + 1] === undefined) delete reactions['▶️'];
        page.reactions = reactions;
    });
    const mainName = 'main';
    pages[0].reactions['◀️'] = mainName;
    const helpMenu = new Menu(message.channel, message.author.id, [{
        name: mainName,
        content: new MessageEmbed({
            author: {
                name: 'Pug Bot Help',
            },
            description: '[Support Server]() | [Invite URL]()',
            fields: [{

                name: ':large_blue_diamond: Pug Bot',
                value: 'info tomato potato',
            },
            {
                name: ':large_blue_diamond: Prefix of pugbot : `prefix`',
                value: 'version : ',
            },
            {
                name: '\u200b',
                value: '\u200b',
            },
            {
                name: 'Interactive reaction system',
                value: '\u200b\nReact with `▶️` to proceed to the next page \nReact with `◀️` to proceed to the previous page \nWhen you are done , react with 🗑️ to delete the command module viewer',
            },
            ],
            time: new Date(),
            footer: {
                text: '',
                iconURL: '',
            },


        }),
        reactions: {
            '▶️': 'next',
            '🗑️': 'delete',
        },
    }, ...pages],
    30000);
    helpMenu.start();
};

module.exports = {
    name: 'help',
    description: 'I honestly don\'t know',
    run,
};


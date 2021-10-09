import { database, testing } from "..";
import { d20 } from "../clients";
import { accountForPrestige, createCard, generatecard, getLevel, getLevelCost, getposition, prestige } from "../d20/function";
import { say } from "./functions";
import { ignore_channels, testChannelId } from "./variables";


d20.on('messageCreate', async (msg) => {
    if (!msg || !msg.member || !msg.author || msg.author.bot) return;
    if (ignore_channels.includes(msg.channel.id)) return;
    if (testing && msg.channelId != testChannelId) return;
    else if (!testing && msg.channelId == testChannelId) return;
    let args = msg.content;
    if (args.startsWith('!')) {
        args = args.replace(/!/, '');
        switch (args.split(' ')[0]) {
            case 'card':
                msg.channel.sendTyping();
                msg.channel.send({ files: [await generatecard(msg)] });
                break;
            case 'prestige':
                prestige(msg);
                break;
            case 'c':
            case 'profile':
                say(d20, msg.channel, 'You can customize your card at https://cyanmarine.net/tc/card/customize');
                break;
        };
    };
});
import { d20 } from "../clients";
import { createCard } from "../d20/function";
import { say } from "./functions";
import { testChannelId } from "./variables";

d20.on('messageCreate', async (msg) => {
    if (!msg || !msg.member || !msg.author || msg.author.bot) return;
    if (msg.channelId != testChannelId) return;
    let args = msg.content;
    if (args.startsWith('!')) {
        console.log('A');
        args.replace(/!/, '');
        switch (args.split(' ')[0]) {
            case 'card':
                console.log('B');
                say(d20, msg.channel, { files: [await (await createCard(msg.author.tag, 1, 1, 'Test', 'test', 1, 1, 1, 1, 1)).toBuffer()] });
                break;
        }
    }
})
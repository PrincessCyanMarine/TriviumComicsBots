import { d20 } from "../clients";
import { testChannelId } from "../common/variables";
import { testCommands } from "./commandHandler";
import { countMessages, createCard } from "./function";

d20.on('messageCreate', (msg) => {
    if (!msg || !msg.author || msg.author.bot) return;
    if (msg.channelId != testChannelId) return;
    /*if (msg.guildId == '562429293364248587')*/ countMessages(msg);
    createCard(msg.author.tag, 1, 1000, 'The sea princess', 'Krystal', 5, 1, 100, 0, -500).then((card) => {
        msg.channel.send({ files: [card.toBuffer()] });
    })
    testCommands(msg);
})
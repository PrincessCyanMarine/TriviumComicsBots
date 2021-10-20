import { testing } from "..";
import { d20 } from "../clients";
import { ignore_channels, testChannelId } from "../common/variables";
import { testCommands } from "./commandHandler";
import { countMessages } from "./function";

d20.on('messageCreate', (msg) => {
    if (!msg || !msg.author || msg.author.bot) return;
    if (msg.content.startsWith('!')) return;
    if (ignore_channels.includes(msg.channel.id)) return;
    if (testing && msg.channelId != testChannelId) return;
    else if (!testing && msg.channelId == testChannelId) return;
    countMessages(msg);
    testCommands(msg);
});
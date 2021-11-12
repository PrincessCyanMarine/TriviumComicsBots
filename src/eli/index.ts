import { testing } from "..";
import { eli } from "../clients";
import { ignore_channels, testChannelId } from "../common/variables";
import { testCommands } from "./commandHandler";

eli.on('messageCreate', (msg) => {
    if (!msg || !msg.member || !msg.author || msg.author.bot) return;
    if (msg.content.startsWith('!')) return;
    if (ignore_channels.includes(msg.channel.id)) return;
    if (testing && msg.channelId != testChannelId) return;
    else if (!testing && msg.channelId == testChannelId) return;
    testCommands(msg);
});
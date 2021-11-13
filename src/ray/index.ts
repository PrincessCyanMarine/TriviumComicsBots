import { testing } from "..";
import { ray } from "../clients";
import { ignore_channels, testChannelId } from "../common/variables";
import { testCommands } from "./commandHandler";
import { roleplay } from "./functions";

ray.on('messageCreate', (msg) => {
    if (!msg || !msg.member || !msg.author || msg.author.bot) return;
    roleplay(msg);
    if (msg.content.startsWith('!')) return;
    if (ignore_channels.includes(msg.channel.id)) return;
    if (testing && msg.channelId != testChannelId) return;
    else if (!testing && msg.channelId == testChannelId) return;
    testCommands(msg);
});
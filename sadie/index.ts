import { testing } from "..";
import { sadie } from "../clients";
import { ignore_channels, testChannelId } from "../common/variables";
import { testCommands } from "./commandHandler";


sadie.on('messageCreate', (msg) => {
    if (!msg || !msg.author || msg.author.bot) return;
    if (ignore_channels.includes(msg.channel.id)) return;
    if (testing && msg.channelId != testChannelId) return;
    else if (!testing && msg.channelId == testChannelId) return;
    testCommands(msg);
});

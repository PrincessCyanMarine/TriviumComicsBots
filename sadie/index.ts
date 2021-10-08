import { testing } from "..";
import { sadie } from "../clients";
import { testChannelId } from "../common/variables";
import { testCommands } from "./commandHandler";


sadie.on('messageCreate', (msg) => {
    if (!msg || !msg.author || msg.author.bot) return;
    if (testing && msg.channelId != testChannelId) return;
    else if (!testing && msg.channelId == testChannelId) return;
    testCommands(msg);
});

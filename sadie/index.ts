import { d20 } from "../clients";
import { testChannelId } from "../common/variables";
import { testCommands } from "./commandHandler";


d20.on('messageCreate', (msg) => {
    if (!msg || !msg.author || msg.author.bot) return;
    if (msg.channelId != testChannelId) return;
    testCommands(msg);
});
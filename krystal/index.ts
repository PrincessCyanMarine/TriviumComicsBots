import { krystal } from "../clients";
import { detectEmoji, say } from "../common/functions";
import { testChannelId } from "../common/variables";
import { testCommands } from "./commandHandler";

krystal.on('messageCreate', (msg) => {
    if (!msg || !msg.author || msg.author.bot) return;
    if (msg.channelId != testChannelId) return;
    let emoji = detectEmoji(msg.content);
    if (emoji != msg.content) say(krystal, msg.channel, emoji);
    testCommands(msg);
});

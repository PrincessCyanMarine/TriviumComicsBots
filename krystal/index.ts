import { krystal } from "../clients";
import { testChannelId } from "../common/variables";
import { testCommands } from "./commandHandler";
import { loadImages } from "./functions";

krystal.on('ready', () => {
    loadImages();
});

krystal.on('messageCreate', (msg) => {
    if (!msg || !msg.author || msg.author.bot) return;
    if (msg.channelId != testChannelId) return;
    testCommands(msg);
});

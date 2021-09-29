import { krystal } from "../clients";
import { testGuildId } from "../common/variables";
import { testCommands } from "./functions";

krystal.on('messageCreate', (msg) => {
    if (!msg || !msg.author || msg.author.bot) return;
    if (msg.guildId != testGuildId) return;
    testCommands(msg);
});

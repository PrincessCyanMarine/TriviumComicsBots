import { testing } from "..";
import { ray } from "../clients";
import { ignore_message } from "../common/functions";
import { Help } from "../common/help";
import { ignore_channels, testChannelId } from "../common/variables";
import { testCommands } from "./commandHandler";
import { roleplay } from "./functions";

ray.on("messageCreate", (msg) => {
    roleplay(msg);
    if (ignore_message(msg, ray)) return;
    testCommands(msg);
});

ray.on("interactionCreate", (interaction) => {
    if ((interaction.isSelectMenu() || interaction.isButton()) && interaction.customId.startsWith("help")) {
        Help.processInteraction(interaction);
    }
});

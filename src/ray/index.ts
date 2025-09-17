import { database, testing } from "..";
import { clients, eli, id2bot, ray, sadie } from "../clients";
import { ignore_message, say } from "../common/functions";
// import { Help } from "../common/help";
import { ignore_channels, roleplay_channels, testChannelId } from "../common/variables";
import { testCommands } from "./commandHandler";
import { roleplay } from "./functions";

ray.on('ready', async () => {
    await ray.user?.setActivity('Supporting Eli\'s mourning', { type: 'CUSTOM' });
    await ray.user?.setStatus('dnd');
});

ray.on("messageCreate", (msg) => {
    roleplay(msg);
    if (ignore_message(msg, ray)) return;
    testCommands(msg);
});

// ray.on("typingStart", async (typing) => {
//     if (typing.channel.id == roleplay_channels().input) {
//         let bot = await (await database.child("roleplay/" + typing.user.id).once("value")).val();
//         if (!bot) {
//             say(ray, typing.channel, "You need to select a character to roleplay as");
//             return;
//         }

//         let out = await clients[id2bot[bot]].channels.fetch(roleplay_channels().output);
//         if (!out?.isText()) return;
//         out.sendTyping();
//     }
// });

// ray.on("interactionCreate", (interaction) => {
//     if ((interaction.isSelectMenu() || interaction.isButton()) && interaction.customId.startsWith("help")) {
//         Help.processInteraction(interaction);
//     }
// });

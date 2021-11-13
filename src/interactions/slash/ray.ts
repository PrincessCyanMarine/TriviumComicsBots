import { CommandInteraction } from "discord.js";
import { database, testing } from "../..";
import { id2bot, krystal, mod_alert_webhook, ray } from "../../clients";
import { capitalize, say } from "../../common/functions";
import { botIds, ignore_channels } from "../../common/variables";
import { followup, reply } from "./common";


ray.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand() || !interaction.channel) return;
    if (ignore_channels.includes(interaction.channelId)) { reply(interaction, 'Please try in another channel', true); return; }
    if (testing && interaction.channelId != '892800588469911663') return;
    else if (!testing && interaction.channelId == '892800588469911663') return;

    switch (interaction.commandName) {
        case 'roleplay':
            let bot = interaction.options.get('character')?.user?.id;
            if (!bot) return;
            if (!botIds.includes(bot)) { interaction.reply({ ephemeral: true, content: "Not a valid character" }); return; };
            database.child('roleplay/' + interaction.member.user.id).set(bot);
            interaction.reply("Succesfully set character to " + capitalize(id2bot[bot].toLowerCase()));
            break;
    };
});

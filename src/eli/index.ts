import { testing } from "..";
import { eli } from "../clients";
import { ignore_message } from "../common/functions";
import { ignore_channels, testChannelId } from "../common/variables";
import { Calculator } from "../games/calculator";
import { testCommands } from "./commandHandler";

eli.on("messageCreate", (msg) => {
    if (ignore_message(msg, eli)) return;
    testCommands(msg);
});

eli.on("interactionCreate", (interaction) => {
    if (interaction.isButton()) {
        if (testing && interaction.channelId != testChannelId) return;
        if (!testing && interaction.channelId == testChannelId) return;

        let match = interaction.customId.match(/calculator_(?<id>[0-9]+?)_button_(?<button>.+)/);
        if (match?.groups) {
            /*if (match.groups.id != interaction.member?.user.id) {
                interaction.reply({ ephemeral: true, content: 'To invoke a calculator, use the command "!calculator"' });
                return;
            }*/

            Calculator.processInteraction(interaction, match.groups.button);
        }
    }
});

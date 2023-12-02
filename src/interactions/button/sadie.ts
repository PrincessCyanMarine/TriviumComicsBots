import { ButtonInteraction } from "discord.js";
import { testing } from "../..";
import { sadie } from "../../clients";
import { testChannelId } from "../../common/variables";

const _commands: { names: string[]; callback: (interaction: ButtonInteraction) => Promise<void> }[] = [];
export const addSadieButtonCommand = (names: string | string[], callback: (interaction: ButtonInteraction) => Promise<void>) => {
    if (!Array.isArray(names)) names = [names];
    _commands.push({
        names,
        callback,
    });
};

sadie.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;
    if (testing && interaction.channelId != testChannelId) return;
    else if (!testing && interaction.channelId == testChannelId) return;
    // console.log(interaction.customId);

    switch (interaction.customId) {
        default:
            for (let { names, callback } of _commands) {
                if (names.includes(interaction.customId.split("?")[0])) {
                    await callback(interaction);
                    return;
                }
            }
            interaction.reply({ ephemeral: true, content: "The command " + interaction.customId.split("?")[0] + " has not been implemented" });
            break;
    }
});

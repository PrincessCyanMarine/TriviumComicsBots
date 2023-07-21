import { SlashCommandBuilder } from "@discordjs/builders";
import { addD20SlashCommand } from "../interactions/slash/d20";
import { marineId, setTestChannelId, testChannelId } from "../common/variables";
import { CommandInteraction } from "discord.js";

let command = new SlashCommandBuilder().setName("test").setDescription("Set this as the test channel");
export const changeTestChannel = async (interaction: CommandInteraction) => {
    if (interaction.user.id != marineId) {
        interaction.reply("You are not Marine");
        return;
    }
    if (testChannelId == interaction.channelId) {
        interaction.reply("This is already the test channel");
        return;
    }
    setTestChannelId(interaction.channelId);
    interaction.reply("This is now the test channel");
};
addD20SlashCommand(command, changeTestChannel);

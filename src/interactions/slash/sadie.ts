import { SlashCommandBuilder } from "@discordjs/builders";
import { CacheType, CommandInteraction } from "discord.js";
import { addCommandToGuild, reply, slash_commands } from "./common";
import { testing } from "../..";
import { sadie } from "../../clients";
import { ignore_channels, marineId, setTestChannelId, testChannelId, testGuildId } from "../../common/variables";

sadie.on("ready", async () => {
    console.log("Sadie is processing slash commands");
});

sadie.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;
    if (ignore_channels.includes(interaction.channelId)) {
        reply(interaction, "Try another channel", true);
        return;
    }

    if (interaction.commandName == "test") {
        if (interaction.user.id != marineId) {
            if (!testing) interaction.reply("You are not Marine");
            return;
        }
        if (testChannelId == interaction.channelId) {
            if (!testing) interaction.reply(`This is already the test channel`);
            return;
        }
        setTestChannelId(interaction.channelId);
        if (!testing) interaction.reply(`This is now the test channel`);
        return;
    }

    if (testing && interaction.channelId != testChannelId) return;
    else if (!testing && interaction.channelId == testChannelId) return;

    switch (interaction.commandName) {
        default:
            for (let { name, callback } of slash_commands["sadie"]) {
                if (name == interaction.commandName) {
                    callback(interaction);
                    return;
                }
            }
            interaction.reply({ ephemeral: true, content: "The command /" + interaction.commandName + " has not been implemented" });
            break;
    }
});

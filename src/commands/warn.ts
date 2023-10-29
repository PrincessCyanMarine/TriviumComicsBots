import { GuildMember } from "discord.js";
import { addD20SlashCommand } from "../interactions/slash/d20";
import { warn } from "../d20/functions";
import { SlashCommandBuilder, SlashCommandStringOption, SlashCommandUserOption } from "@discordjs/builders";

let command = new SlashCommandBuilder().setName("warn").setDescription("Warn a player");
let playerOption = new SlashCommandUserOption().setName("player").setDescription("Player to warn").setRequired(true);
let reasonOption = new SlashCommandStringOption().setName("reason").setDescription("Reason for warning").setRequired(true);

command.addUserOption(playerOption).addStringOption(reasonOption);

addD20SlashCommand(command, async (interaction) => {
    let reason = interaction.options.get("reason")?.value;
    let player = interaction.options.get("player")?.member;

    if (!(interaction.member instanceof GuildMember) || !(player instanceof GuildMember)) return;

    if (!interaction.member.permissions.has("KICK_MEMBERS") && !player.permissions.has("KICK_MEMBERS")) {
        interaction.reply({ content: "You can' do that", ephemeral: true });
        return;
    }

    if (!reason || !(typeof reason == "string") || !interaction.guildId || !interaction.channel) {
        interaction.reply({ content: "Something went wrong", ephemeral: true });
        return;
    }
    warn(player, interaction.guildId, reason, interaction);
});

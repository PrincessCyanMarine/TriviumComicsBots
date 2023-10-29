import { SlashCommandBuilder, SlashCommandIntegerOption, SlashCommandUserOption } from "@discordjs/builders";
import { mute_unmute } from "../d20/functions";
import { addD20SlashCommand } from "../interactions/slash/d20";

let mute_command = new SlashCommandBuilder().setName("mute").setDescription("Mute a player");
let unmute_command = new SlashCommandBuilder().setName("unmute").setDescription("Unmute a player");

let playerOption = new SlashCommandUserOption().setName("player").setDescription("Player to mute").setRequired(true);
let minutesOption = new SlashCommandIntegerOption().setName("minutes").setDescription("Minutes to mute").setRequired(false);
let hoursOption = new SlashCommandIntegerOption().setName("hours").setDescription("Hours to mute").setRequired(false);
let daysOption = new SlashCommandIntegerOption().setName("days").setDescription("Days to mute").setRequired(false);

mute_command.addUserOption(playerOption).addIntegerOption(minutesOption).addIntegerOption(hoursOption).addIntegerOption(daysOption);
unmute_command.addUserOption(playerOption);

addD20SlashCommand(mute_command, async (interaction) => {
    mute_unmute(interaction);
});

addD20SlashCommand(unmute_command, async (interaction) => {
    mute_unmute(interaction);
});

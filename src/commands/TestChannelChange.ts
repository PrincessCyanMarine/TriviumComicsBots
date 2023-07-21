import { SlashCommandBuilder } from "@discordjs/builders";
import { addD20SlashCommand } from "../interactions/slash/d20";

let command = new SlashCommandBuilder().setName("test").setDescription("Set this as the test channel");
addD20SlashCommand(command, async () => {});

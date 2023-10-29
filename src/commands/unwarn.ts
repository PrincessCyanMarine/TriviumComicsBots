import { SlashCommandBuilder, SlashCommandUserOption } from "@discordjs/builders";
import { addD20SlashCommand } from "../interactions/slash/d20";
import { GuildMember, MessageActionRow, MessageButton, MessageSelectMenu } from "discord.js";
import { reply } from "../interactions/slash/common";
import { database } from "..";

let command = new SlashCommandBuilder().setName("unwarn").setDescription("Unwarn a player");
let playerOption = new SlashCommandUserOption().setName("player").setDescription("Player to unwarn").setRequired(true);

command.addUserOption(playerOption);

addD20SlashCommand(command, async (interaction) => {
    if (!(interaction.member instanceof GuildMember)) return;
    if (!interaction.member.permissions.has("KICK_MEMBERS")) {
        reply(interaction, "You can' do that", true);
        return;
    }

    let player = interaction.options.get("player")?.member;

    if (!player || !(player instanceof GuildMember) || !interaction.guildId || !interaction.channel) {
        reply(interaction, "Something went wrong", true);
        return;
    }

    let warnings = (await (await database.child(`warnings/${interaction.guildId}/${player.id}`).once("value")).val()) ?? {};
    if (Array.isArray(warnings)) warnings = Object.fromEntries(warnings.map((v, i) => [i, v]));
    let keys = Object.keys(warnings);
    if (keys.length == 0) {
        reply(interaction, "This player has no warnings!", true);
        return;
    }

    // console.log(warnings);
    let components = [
        new MessageActionRow().addComponents(
            new MessageSelectMenu()
                .setCustomId(`unwarn?guild=${interaction.guildId}&user=${player.id}`)
                .setOptions(keys.slice(0, 25).map((v) => ({ label: warnings[v], value: v })))
        ),
    ];
    if (keys.length > 25)
        components.push(
            new MessageActionRow().addComponents(new MessageButton().setCustomId("next_unwarn?page=2").setLabel("More").setStyle("PRIMARY"))
        );

    interaction.reply({
        components,
        content: "Select the warnings to remove",
        // ephemeral: true,
    });
});

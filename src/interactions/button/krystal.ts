import { GuildMember, PermissionFlagsBits } from "discord.js";
import { database, testing } from "../..";
import { krystal } from "../../clients";
import { colors, triviumGuildId } from "../../common/variables";

krystal.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;
    if (testing && interaction.channelId != "892800588469911663") return;
    else if (!testing && interaction.channelId == "892800588469911663") return;
    // console.log(interaction.customId);

    if (interaction.customId.startsWith("colors")) {
        const match = interaction.customId.match(/colors\?id=([0-9]+)/);
        if (!match) return;
        const id = match[1];

        if (!(interaction.member instanceof GuildMember)) return;

        for (const [name, color, roleId, emoji, necessaryIds] of colors) {
            if (interaction.member.roles.cache.has(roleId)) {
                interaction.member.roles.remove(roleId);
                if (roleId === id) {
                    interaction.reply({ content: "Removed the " + color + " role", ephemeral: true });
                    break;
                }
            }

            let mod = interaction.member.permissions.has(PermissionFlagsBits.ManageRoles);

            if (id === roleId) {
                let hasRole = false;
                for (const necessary of necessaryIds)
                    if (mod || interaction.member.roles.cache.has(necessary)) {
                        hasRole = true;

                        interaction.member.roles.add(roleId);
                        interaction.reply({ content: "You have been given the " + color + " role", ephemeral: true });
                        break;
                    }
                if (!hasRole) interaction.reply({ content: "You don't have the necessary role", ephemeral: true });
            }
        }
    }

    switch (interaction.customId) {
        case "gamemastersfanrole":
        case "queensbladetogglealerts": {
            let correctGuild = interaction.customId == "gamemastersfanrole" ? triviumGuildId : "620088019868844042";
            if (
                !interaction.guildId ||
                !interaction.guild ||
                !interaction.member ||
                !(interaction.member instanceof GuildMember) ||
                correctGuild != interaction.guildId
            )
                return;
            let role_id = interaction.customId == "gamemastersfanrole" ? "774127564675481600" : "900363259188772865";
            let role = await interaction.guild.roles.fetch(role_id);
            if (!role) return;
            let roles = interaction.member.roles;
            if (!roles.cache.has(role_id))
                roles.add(role).then(() => {
                    interaction.reply({ content: `<@&${role_id}> role added!`, ephemeral: true });
                });
            else
                roles.remove(role).then(() => {
                    interaction.reply({ content: `<@&${role_id}> role removed!`, ephemeral: true });
                });
            break;
        }
        case "geminitwilightfanrole": {
            let correctGuild = triviumGuildId;
            if (
                !interaction.guildId ||
                !interaction.guild ||
                !interaction.member ||
                !(interaction.member instanceof GuildMember) ||
                correctGuild != interaction.guildId
            )
                return;
            let role_id = "819361862474661890";
            let role = await interaction.guild.roles.fetch(role_id);
            if (!role) return;
            let roles = interaction.member.roles;
            try {
                if (!roles.cache.has(role_id)) {
                    await roles.add(role);
                    interaction.reply({ content: `<@&${role_id}> role added!`, ephemeral: true });
                } else {
                    await roles.remove(role);
                    interaction.reply({ content: `<@&${role_id}> role removed!`, ephemeral: true });
                }
            } catch (err) {
                console.error(err);
                interaction.reply({ content: `Interaction failed...`, ephemeral: true });
            }
            break;
        }
    }
});

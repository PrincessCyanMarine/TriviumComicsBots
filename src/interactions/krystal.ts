import { GuildMember } from "discord.js";
import { testing } from "..";
import { krystal } from "../clients";
import { testGuildId, triviumGuildId } from "../common/variables";

krystal.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    if (testing && interaction.channelId != '892800588469911663') return;
    else if (!testing && interaction.channelId == '892800588469911663') return;
    console.log(interaction.customId);
    switch (interaction.customId) {
        case "gamemastersfanrole":
        case "queensbladetogglealerts":
            let correctGuild = interaction.customId == "gamemastersfanrole" ? triviumGuildId : "620088019868844042";
            if (!interaction.guildId || !interaction.guild || !interaction.member || !(interaction.member instanceof GuildMember) || correctGuild != interaction.guildId) return;
            let role_id = interaction.customId == "gamemastersfanrole" ? "774127564675481600" : "900363259188772865";
            let role = interaction.guild.roles.cache.get(role_id);
            if (!role) return;
            let roles = interaction.member.roles;
            if (!roles.cache.has(role_id))
                roles.add(role).then(() => { interaction.reply({ content: `<@&${role_id}> role added!`, ephemeral: true }) });
            else
                roles.remove(role).then(() => { interaction.reply({ content: `<@&${role_id}> role removed!`, ephemeral: true }) });;
            break;
    }
});
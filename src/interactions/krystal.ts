import { GuildMember } from "discord.js";
import { testing } from "..";
import { krystal } from "../clients";
import { testGuildId, triviumGuildId } from "../common/variables";

krystal.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    if (testing && interaction.channelId != '892800588469911663') return;
    else if (!testing && interaction.channelId == '892800588469911663') return;

    switch (interaction.customId) {
        case "gamemastersfanrole":
        case "queensbladetogglealerts":
            if (!interaction.guildId || !interaction.guild || !interaction.member || !(interaction.member instanceof GuildMember) || (triviumGuildId != interaction.guildId && interaction.guildId != "900362801992835073")) return;
            let role_id = interaction.guildId == triviumGuildId ? "774127564675481600" : "620088019868844042";
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
import { GuildMember } from "discord.js";
import { testing } from "..";
import { d20 } from "../clients";
import { testGuildId, triviumGuildId } from "../common/variables";

d20.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    if (testing && interaction.channelId != '892800588469911663') return;
    else if (!testing && interaction.channelId == '892800588469911663') return;

    switch (interaction.customId) {
        case "gamemastersfanrole":
            if (!interaction.guildId || !interaction.guild || !interaction.member || !(interaction.member instanceof GuildMember) || ![triviumGuildId, testGuildId].includes(interaction.guildId)) return;
            let role_id = interaction.guildId == triviumGuildId ? "774127564675481600" : "781715781234720768";
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
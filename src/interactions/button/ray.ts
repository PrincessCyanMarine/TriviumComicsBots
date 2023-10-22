import { GuildMember, Message } from "discord.js";
import { testing } from "../..";
import { ray } from "../../clients";
// import { Help } from "../../common/help";
import { testChannelId, triviumGuildId } from "../../common/variables";
import { get_rank_message } from "../../d20/functions";

ray.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;
    if (testing && interaction.channelId != testChannelId) return;
    else if (!testing && interaction.channelId == testChannelId) return;

    // console.log(interaction.customId);

    if (interaction.customId.startsWith("rank")) {
        let rank_match = interaction.customId.match(/rank\?p=(?<page>[0-9]+)/);
        if (!(interaction.message instanceof Message) || !interaction.guild || !rank_match || !rank_match.groups) return;
        // if (rank_match.groups["userId"] != interaction.user.id) { interaction.reply({ content: "You can't do that", ephemeral: true }); return }
        // console.log(rank_match.groups);
        interaction.update(await get_rank_message(interaction.guild, interaction.user.id, undefined, parseInt(rank_match.groups["page"])));
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

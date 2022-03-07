import { Message } from "discord.js";
import { testing } from "../..";
import { ray } from "../../clients";
import { Help } from "../../common/help";
import { testChannelId } from "../../common/variables";
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
});

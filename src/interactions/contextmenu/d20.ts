import { GuildMember, User } from "discord.js";
import { testing } from "../..";
import { d20 } from "../../clients";
import { testChannelId, triviumGuildId } from "../../common/variables";
import { generatecard, mute_unmute } from "../../d20/functions";

d20.on("interactionCreate", async (interaction) => {
    if (!interaction.isContextMenu()) return;
    if (testing && interaction.channelId != testChannelId) return;
    else if (!testing && interaction.channelId == testChannelId) return;

    switch (interaction.commandName) {
        case "card":
            // interaction.deferReply();
            try {
                let card = await generatecard(interaction);
                interaction.reply({ files: [card] });
            } catch (er) {
                console.error(er);
                interaction.reply({ content: "Something went wrong..." });
            }
            break;
        case "get profile picture":
            let user;
            if (interaction.targetType == "USER") user = interaction.options.getUser("user");
            else user = interaction.options.getMessage("message")?.author;
            if (!(user instanceof User)) return;
            interaction.reply({ content: user.avatarURL({ size: 1024, dynamic: true }), ephemeral: true });
            break;
        case "mute":
        case "unmute":
            mute_unmute(interaction);
            break;
    }
});

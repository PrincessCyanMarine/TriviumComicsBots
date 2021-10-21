import { userMention } from "@discordjs/builders";
import { User } from "discord.js";
import { testing } from "../..";
import { krystal } from "../../clients";
import emojis from "../../common/emojis";
import { protectedFromKills, testChannelId } from "../../common/variables";
import { killing } from "../../krystal/functions";

krystal.on('interactionCreate', async (interaction) => {
    if (!interaction.isContextMenu()) return;
    if (testing && interaction.channelId != testChannelId) return;
    else if (!testing && interaction.channelId == testChannelId) return;

    switch (interaction.commandName) {
        case "unalive":
            let user;

            if (interaction.targetType == "USER")
                user = interaction.options.getUser("user");
            else
                user = interaction.options.getMessage("message")?.author;

            if (!(user instanceof User)) return;
            if (protectedFromKills.includes(user.id)) user = interaction.user;
            interaction.reply({ content: `***I will unalive ${userMention(user.id)} now ${emojis[":GMKrystalDevious:"]}!!!***`, files: [await killing(undefined, user)] });
            break;
    };
});
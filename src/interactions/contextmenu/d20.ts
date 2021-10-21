import { User } from "discord.js";
import { testing } from "../..";
import { d20 } from "../../clients";
import { testChannelId } from "../../common/variables";

d20.on('interactionCreate', (interaction) => {
    if (!interaction.isContextMenu()) return;
    if (testing && interaction.channelId != testChannelId) return;
    else if (!testing && interaction.channelId == testChannelId) return;

    switch (interaction.commandName) {
        case "card":

            break;
        case "get profile picture":
            let user;
            if (interaction.targetType == "USER")
                user = interaction.options.getUser("user");
            else
                user = interaction.options.getMessage("message")?.author;
            if (!(user instanceof User)) return;
            interaction.reply({ content: user.avatarURL({ size: 1024, format: "png" }), ephemeral: true });
            break;
    };
});
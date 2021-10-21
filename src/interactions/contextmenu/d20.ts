import { User } from "discord.js";
import { testing } from "../..";
import { d20 } from "../../clients";
import { testChannelId } from "../../common/variables";
import { generatecard } from "../../d20/function";

d20.on('interactionCreate', async (interaction) => {
    if (!interaction.isContextMenu()) return;
    if (testing && interaction.channelId != testChannelId) return;
    else if (!testing && interaction.channelId == testChannelId) return;

    switch (interaction.commandName) {
        case "card":
            // interaction.deferReply();
            try {
                let card = await generatecard(interaction);
                interaction.reply(({ files: [card] }));
            } catch (er) {
                console.error(er);
                interaction.reply({ content: 'Something went wrong...' });
            }
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
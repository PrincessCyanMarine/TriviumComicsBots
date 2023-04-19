import { userMention } from "@discordjs/builders";
import { User } from "discord.js";
import { database, testing } from "../..";
import { krystal } from "../../clients";
import emojis from "../../common/emojis";
import { protectedFromKills, testChannelId } from "../../common/variables";
import { killing, spared_player_id } from "../../krystal/functions";

krystal.on("interactionCreate", async (interaction) => {
    if (!interaction.isContextMenuCommand()) return;
    if (testing && interaction.channelId != testChannelId) return;
    else if (!testing && interaction.channelId == testChannelId) return;

    let user;

    await interaction.deferReply();

    if (interaction.isUserContextMenuCommand()) user = interaction.options.getUser("user");
    else user = interaction.options.getMessage("message")?.author;

    if (!(user instanceof User)) {
        interaction.editReply(`Something went wrong...`);
        return;
    }

    switch (interaction.commandName) {
        case "unalive": {
            if (protectedFromKills.includes(user.id)) user = interaction.user;
            if (user.id == spared_player_id) {
                interaction.editReply(`Sorry, <@${interaction.user.id}>, I was asked to spare that unattractive weeb`);
                return;
            }
            interaction.editReply({
                content: `***I will unalive ${userMention(user.id)} now ${emojis[":GMKrystalDevious:"]}!!!***`,
                files: [await killing(undefined, user)],
            });
            break;
        }
        case "spare": {
            await database.child("dontattack").set(user.id);
            interaction.editReply("Understood, I will spare the unattractive weeb!");
            break;
        }
    }
});

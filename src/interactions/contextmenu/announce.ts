import { testing } from "../..";
import { clients } from "../../clients";
import { testChannelId } from "../../common/variables";
import { makeAnnouncement } from "./common";

Object.values(clients).forEach(bot => {
    bot.on('interactionCreate', (interaction) => {
        if (!interaction.isContextMenu()) return;
        if (testing && interaction.channelId != testChannelId) return;
        else if (!testing && interaction.channelId == testChannelId) return;

        // console.log(interaction);
        switch (interaction.commandName) {
            case "announce":
                makeAnnouncement(interaction, bot);
                break;
        };
    });
})
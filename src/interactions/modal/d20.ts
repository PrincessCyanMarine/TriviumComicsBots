import { InteractionUpdateOptions } from "discord.js";
import { testing } from "../..";
import { d20 } from "../../clients";
import { testChannelId } from "../../common/variables";
import { getCardStyle, sendCardCustomizationMessage, setCardStyle } from "../../common/functions";
import { MessageOptions } from "child_process";
import { isCardCustomizationMessageFromUser } from "../../d20/functions";

d20.on("interactionCreate", async (interaction) => {
    if (!interaction.isModalSubmit()) return;
    if (testing && interaction.channelId != testChannelId) return;
    else if (!testing && interaction.channelId == testChannelId) return;

    // console.log(interaction.customId);

    switch (interaction.customId) {
        case "card_title": {
            if (isCardCustomizationMessageFromUser(interaction)) return;
            let title = interaction.components[0].components[0].value;
            let style = await getCardStyle(interaction.user.id);
            await setCardStyle(interaction.user.id, { title });
            await sendCardCustomizationMessage(interaction, false, style);
            break;
        }
        case "card_colors": {
            if (isCardCustomizationMessageFromUser(interaction)) return;
            let [color, color2] = interaction.components.map((c) => {
                let color = c.components[0].value || undefined;
                if (!color) return undefined;
                color = color.toUpperCase();
                if (color.match(/^([0-9a-f]{6})$/i)) color = "#" + color;
                if (!color.match(/^#([0-9a-f]{6})$/i)) return undefined;
                return color;
            });

            if (!color) {
                interaction.reply({ content: "You must provide a valid color!", ephemeral: true });
                return;
            }

            let style = await getCardStyle(interaction.user.id);
            await setCardStyle(interaction.user.id, { color, color2 });
            (await sendCardCustomizationMessage(interaction, false, style)) as InteractionUpdateOptions;
            break;
        }
    }
});

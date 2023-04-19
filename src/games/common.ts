import { ButtonInteraction, ButtonStyle, InteractionReplyOptions, InteractionUpdateOptions, SelectMenuInteraction } from "discord.js";
import emojis from "../common/emojis";
import { ButtonBuilder, SelectMenuBuilder, SelectMenuOptionBuilder, StringSelectMenuOptionBuilder } from "@discordjs/builders";

const getReplyMessage = (content: string | InteractionUpdateOptions | InteractionReplyOptions, exclusive: boolean): InteractionReplyOptions => ({
    content: typeof content == "string" ? content : content.content ?? "Something went wrong...",
    ephemeral: exclusive,
    components: typeof content == "string" ? [] : content.components,
});
const getUpdateMessage = (content: string | InteractionUpdateOptions | InteractionReplyOptions): InteractionUpdateOptions => ({
    content: typeof content == "string" ? content : content.content,
    components: typeof content == "string" ? [] : content.components,
});

export function reply(interaction: SelectMenuInteraction | ButtonInteraction, content: string | InteractionReplyOptions, exclusive: boolean = false) {
    return new Promise((resolve, reject) => {
        let message: InteractionReplyOptions = getReplyMessage(content, exclusive);

        interaction.reply(message).then(resolve).catch(reject);
    });
}

export function update(interaction: SelectMenuInteraction | ButtonInteraction, content: string | InteractionUpdateOptions) {
    return new Promise((resolve, reject) => {
        let message: InteractionUpdateOptions = getUpdateMessage(content);

        interaction.update(message).then(resolve).catch(reject);
    });
}

export function get_rps_interactible(id: string, list: boolean = false, a = false) {
    return list
        ? [
              new SelectMenuBuilder()
                  .setCustomId(`${a ? "a" : ""}rpssp-${id}`)
                  .setPlaceholder("Play")
                  .setMaxValues(1)
                  .addOptions(
                      new StringSelectMenuOptionBuilder().setLabel("rock").setValue("rock").setEmoji({ id: emojis[":rock:"] }),
                      new StringSelectMenuOptionBuilder().setLabel("paper").setValue("paper").setEmoji({ id: emojis[":paper:"] }),
                      new StringSelectMenuOptionBuilder().setLabel("scissors").setValue("scissors").setEmoji({ id: emojis[":scissors:"] })
                      //   { label: "rock", value: "rock", emoji: emojis[":rock:"] },
                      //   { label: "paper", value: "paper", emoji: emojis[":paper:"] },
                      //   { label: "scissors", value: "scissors", emoji: emojis[":scissors:"] }
                  ),
          ]
        : [
              new ButtonBuilder()
                  .setCustomId(`${a ? "a" : ""}rpssp-${id}/rock`)
                  .setStyle(ButtonStyle.Secondary)
                  .setLabel("Rock")
                  .setEmoji({ id: emojis[":rock:"] }),
              new ButtonBuilder()
                  .setCustomId(`${a ? "a" : ""}rpssp-${id}/paper`)
                  .setStyle(ButtonStyle.Secondary)
                  .setLabel("Paper")
                  .setEmoji({ id: emojis[":paper:"] }),
              new ButtonBuilder()
                  .setCustomId(`${a ? "a" : ""}rpssp-${id}/scissors`)
                  .setStyle(ButtonStyle.Secondary)
                  .setLabel("Scissors")
                  .setEmoji({ id: emojis[":scissors:"] }),
          ];
}

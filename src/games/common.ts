import { ButtonInteraction, InteractionReplyOptions, InteractionUpdateOptions, MessageButton, MessageSelectMenu, SelectMenuInteraction } from "discord.js";
import emojis from "../common/emojis";

const getMessage = (content: string | InteractionUpdateOptions | InteractionReplyOptions, exclusive: boolean): InteractionReplyOptions => ({
    content: typeof content == 'string' ? content : content.content,
    ephemeral: exclusive,
    components: typeof content == 'string' ? [] : content.components
})

export function reply(interaction: SelectMenuInteraction | ButtonInteraction, content: string | InteractionReplyOptions, exclusive: boolean = false) {
    return new Promise((resolve, reject) => {
        let message: InteractionReplyOptions = getMessage(content, exclusive);

        interaction.reply(message)
            .then(resolve)
            .catch(reject);
    });
}

export function update(interaction: SelectMenuInteraction | ButtonInteraction, content: string | InteractionUpdateOptions) {
    return new Promise((resolve, reject) => {
        let message: InteractionReplyOptions = getMessage(content, interaction.ephemeral || false);

        interaction.update(message)
            .then(resolve)
            .catch(reject);
    });
}

export function get_rps_interactible(id: string, list: boolean = false, a = false) {
    return list ?
        [new MessageSelectMenu()
            .setCustomId(`${a ? 'a' : ''}rpssp-${id}`)
            .setPlaceholder("Play")
            .setMaxValues(1)
            .addOptions(
                { label: "rock", value: "rock", emoji: emojis[":rock:"] },
                { label: "paper", value: "paper", emoji: emojis[":paper:"] },
                { label: "scissors", value: "scissors", emoji: emojis[":scissors:"] },
            )
        ] : [
            new MessageButton()
                .setCustomId(`${a ? 'a' : ''}rpssp-${id}/rock`)
                .setStyle("SECONDARY")
                .setLabel("Rock")
                .setEmoji(emojis[":rock:"]),
            new MessageButton()
                .setCustomId(`${a ? 'a' : ''}rpssp-${id}/paper`)
                .setStyle("SECONDARY")
                .setLabel("Paper")
                .setEmoji(emojis[":paper:"]),

            new MessageButton()
                .setCustomId(`${a ? 'a' : ''}rpssp-${id}/scissors`)
                .setStyle("SECONDARY")
                .setLabel("Scissors")
                .setEmoji(emojis[":scissors:"])
        ];
}
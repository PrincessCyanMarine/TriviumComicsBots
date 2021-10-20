import { ButtonInteraction, InteractionReplyOptions, MessageButton, MessageSelectMenu, SelectMenuInteraction } from "discord.js";

const getMessage = (content: string | InteractionReplyOptions, exclusive: boolean): InteractionReplyOptions => ({
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

export function update(interaction: SelectMenuInteraction | ButtonInteraction, content: string | InteractionReplyOptions) {
    return new Promise((resolve, reject) => {
        let message: InteractionReplyOptions = getMessage(content, interaction.ephemeral || false);

        interaction.update(message)
            .then(resolve)
            .catch(reject);
    });
}

export function get_rps_interactible(id: string, list: boolean = false, a = false) {
    return list ?
        [new MessageSelectMenu({
            "customId": `${a ? 'a' : ''}rpssp-${id}`,
            "placeholder": "Play",
            "maxValues": 1,
            "options": [
                { label: "rock", value: "rock", emoji: "<:stone:725123426687123516> " },
                { label: "paper", value: "paper", emoji: "<:paper:725123426452242482>" },
                { label: "scissors", value: "scissors", emoji: "✂️" },
            ]
        })] : [
            new MessageButton()
                .setCustomId(`${a ? 'a' : ''}rpssp-${id}/rock`)
                .setStyle("SECONDARY")
                .setLabel("Rock")
                .setEmoji("<:stone:725123426687123516>"),
            new MessageButton()
                .setCustomId(`${a ? 'a' : ''}rpssp-${id}/paper`)
                .setStyle("SECONDARY")
                .setLabel("Paper")
                .setEmoji("<:paper:725123426452242482>"),

            new MessageButton()
                .setCustomId(`${a ? 'a' : ''}rpssp-${id}/scissors`)
                .setStyle("SECONDARY")
                .setLabel("Scissor")
                .setEmoji("✂️")
        ];
}
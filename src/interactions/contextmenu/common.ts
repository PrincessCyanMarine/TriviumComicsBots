import { Client, ContextMenuInteraction, Message, MessageAttachment } from "discord.js";
import { clients } from "../../clients";
import { say } from "../../common/functions";

export function makeAnnouncement(interaction: ContextMenuInteraction, bot: Client) {
    if (interaction.targetType != "MESSAGE") return;
    let message = interaction.options.getMessage("message");
    if (!(message instanceof Message)) return;

    let attachments: MessageAttachment[] = [];
    message?.attachments.forEach(a => { if (a instanceof MessageAttachment) attachments.push(a) });

    let announcement;
    if (message.content)
        announcement = { content: message?.content, files: attachments };
    else if (attachments.length > 0)
        announcement = { files: attachments };
    else return;

    say(bot, "624774782180917278", announcement).then(() => {
        interaction.reply("Announced");
    }).catch((err) => {
        console.error(err);
        interaction.reply("Failed to announce");
    });
}
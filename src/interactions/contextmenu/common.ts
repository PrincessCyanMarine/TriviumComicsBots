import { Client, Message, AttachmentBuilder, ContextMenuCommandInteraction } from "discord.js";
import { clients } from "../../clients";
import { say } from "../../common/functions";

export function makeAnnouncement(interaction: ContextMenuCommandInteraction, bot: Client) {
    if (!interaction.isMessageContextMenuCommand()) return;
    let message = interaction.options.getMessage("message");
    if (!(message instanceof Message)) return;

    let attachments: AttachmentBuilder[] = [];
    message?.attachments.forEach((a) => {
        if (a instanceof AttachmentBuilder) attachments.push(a);
    });

    let announcement;
    if (message.content) announcement = { content: message?.content, files: attachments };
    else if (attachments.length > 0) announcement = { files: attachments };
    else return;

    say(bot, "624774782180917278", announcement)
        .then(() => {
            interaction.reply("Announced");
        })
        .catch((err) => {
            console.error(err);
            interaction.reply("Failed to announce");
        });
}

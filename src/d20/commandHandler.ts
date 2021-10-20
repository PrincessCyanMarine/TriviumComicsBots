import { Message, MessageEmbed, WebhookClient } from "discord.js";
import { testing } from "..";
import { testGuildId, triviumGuildId } from "../common/variables";

export function testCommands(msg: Message) {
    let args = msg.content.toLowerCase().replace(/\s/g, '');
    // console.log(args);
    if ((args.match(/free/gi) && args.match(/nitro/gi)) || (args.match(/(nitro)|(discord)/gi) && args.match(/(.+?\..+?)|(http)/gi)))
        return nitro(msg);
    for (let { title, description } of msg.embeds)
        if (title?.includes("nitro") || description?.includes("nitro"))
            return nitro(msg);

}

function nitro(msg: Message) {
    if (!testing && msg.guildId != triviumGuildId) return;
    if (testing && msg.guildId != testGuildId) return;
    let webhook_url = testing ?
        "https://discord.com/api/webhooks/900374491916558386/w1tTmMj9W7ycpYBUNwMYC0eW_K00kJMGGKJO8pax85Ztu2HFWqDq71Rs5jffzf-EQv1N" :
        "https://discord.com/api/webhooks/900363561019269130/1qlWM7j3zBdP_OC7GdZReUbFAobAunEcr6uOWNC3HA67_brENhnoSBnO-CJLnZXRvgTH";
    let webhook = new WebhookClient({ url: webhook_url });
    let embed = new MessageEmbed()
        .setAuthor(msg.author.username, msg.author.displayAvatarURL(), msg.url)
        .setDescription(msg.content)
        .setTimestamp(msg.createdTimestamp)
        .setURL(msg.url)
        .setColor(msg.member?.displayHexColor || "WHITE");
    let img = msg.attachments.first()?.url;
    if (img) embed.setImage(img);
    let embeds = msg.embeds;
    embeds.unshift(embed);
    webhook.send({ content: `<@&900363259188772865> please confirm the message below isn\'t a free nitro scam\nMessage url: ${msg.url}`, embeds: embeds });
}
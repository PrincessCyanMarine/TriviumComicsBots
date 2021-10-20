import { Message, WebhookClient } from "discord.js";
import { d20 } from "../clients";
import { say } from "../common/functions";
import { triviumGuildId } from "../common/variables";

export function testCommands(msg: Message) {
    let args = msg.content.toLowerCase().replace(/\s/g, '');
    // console.log(args);
    if ((args.match(/free/gi) && args.match(/nitro/gi)) || (args.match(/(nitro)|(discord)/gi) && args.match(/(.+?\..+?)|(http)/gi)))
        return nitro(msg);
    for (let { title, description } of msg.embeds)
        if (title?.includes("nitro") || description?.includes("nitro"))
            return nitro(msg);

}

const webhook = new WebhookClient({
    url: "https://discord.com/api/webhooks/900363561019269130/1qlWM7j3zBdP_OC7GdZReUbFAobAunEcr6uOWNC3HA67_brENhnoSBnO-CJLnZXRvgTH"
});
function nitro(msg: Message) {
    if (msg.guildId != triviumGuildId) return;
    webhook.send(`<@&900363259188772865> please confirm the message ${msg.url} isn\'t a free nitro scam`);
}
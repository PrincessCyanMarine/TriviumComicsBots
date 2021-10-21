import { Message } from "discord.js";
import { testing } from "..";
import { mod_alert_webhook } from "../clients";
import { msg2embed } from "../common/functions";
import { alert_role_id, triviumGuildId } from "../common/variables";

export function testCommands(msg: Message) {
    if (!testing && msg.guildId != triviumGuildId) return;
    let args = msg.content.toLowerCase().replace(/\s/g, '');
    // console.log(args);
    if ((args.match(/free/gi) && args.match(/nitro/gi)) || (args.match(/(nitro)|(discord)/gi) && args.match(/(.+?\..+?)|(http)/gi)))
        nitro(msg);
    else for (let { title, description } of msg.embeds)
        if (title?.includes("nitro") || description?.includes("nitro"))
            nitro(msg);

    let slur_detection = args.match(/n(e|ig)g[re]?[orae]|fag|nip/gi);
    if (slur_detection) {
        console.log(slur_detection.join(', '));
        mod_alert_webhook(testing)
            .send({
                content: `<@&${alert_role_id}> please confirm the message below doesn\'t include a slur (flagged: "${slur_detection.join(', ')}")\nMessage url: ${msg.url}`,
                embeds: msg2embed(msg)
            });
    }

}

function nitro(msg: Message) {
    mod_alert_webhook(testing).send({
        content: `<@&${alert_role_id}> please confirm the message below isn\'t a free nitro scam\nMessage url: ${msg.url}`,
        embeds: msg2embed(msg)
    });
}
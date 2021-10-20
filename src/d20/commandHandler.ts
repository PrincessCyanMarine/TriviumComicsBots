import { Message } from "discord.js";
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

function nitro(msg: Message) {
    if (msg.guildId != triviumGuildId) return;
    say(d20, "900362801992835073", `<@&900363259188772865> please confirm the message ${msg.url} isn\'t a free nitro scam`);
}
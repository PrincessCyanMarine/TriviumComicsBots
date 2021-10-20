import { Message } from "discord.js";

export function testCommands(msg: Message) {
    let args = msg.content.toLowerCase().replace(/\s/g, '');
    console.log(args);
    if ((args.match(/free/gi) && args.match(/nitro/gi)) || (args.match(/(nitro)|(discord)/gi) && args.match(/(.+?\..+?)|(http)/gi)))
        return msg.channel.send('<@&609593848448155668> please confirm this isn\'t a free nitro scam');
    for (let { title, description } of msg.embeds)
        if (title?.includes("nitro") || description?.includes("nitro"))
            return msg.channel.send('<@&609593848448155668> please confirm this isn\'t a free nitro scam');
}
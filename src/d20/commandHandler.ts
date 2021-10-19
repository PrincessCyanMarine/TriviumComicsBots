import { Message } from "discord.js";

export function testCommands(msg: Message) {
    let args = msg.content.toLowerCase();

    if (args.match(/nitro/gi)) return msg.channel.send('<@&609593848448155668> please confirm this isn\'t a free nitro scam');
}
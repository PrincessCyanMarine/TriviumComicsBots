import { Message, MessageAttachment, User } from "discord.js";
import * as sharp from "sharp";
import { kill } from "./attachments";
import { krystal } from "../clients";
import { getArgs, getImageFromURL, say, testWord } from "../common/functions";
import { greetings } from "./greetings";

export function greet(msg: Message, greeting = Math.floor(Math.random() * greetings.length)) {
    greetings[greeting](msg);
};

export async function killing(msg: Message, target?: User) {
    if (!target) {
        if (msg.mentions.users.first()) target = msg.mentions.users.first();
        else if (testWord(msg.content, "me")) target = msg.author;
    }

    let text = target ? `***I will unalive <@${target.id}> now <:GMKrystalDevious:566416957054910521>!!!***` : "***I will unalive now <:GMKrystalDevious:566416957054910521>***"
    if (!target) {
        say(krystal, msg.channel, { content: text, files: [kill] }).catch(console.error);
    } else {
        let avatarURL = target.avatarURL({ format: "png", size: 1024 });
        if (avatarURL == null) return say(krystal, msg.channel, { content: text, files: [kill] }).catch(console.error);
        let buffer = await getImageFromURL(avatarURL);
        sharp(buffer)
            .resize(500, 500).toBuffer({ resolveWithObject: true }).then(({ data, info }) => {
                sharp(`./assets/krystal/kill/base${Math.floor(Math.random() * 2)}.png`).composite([{
                    input: data,
                    left: 150,
                    top: 200
                }]).toBuffer({ resolveWithObject: true })
                    .then(({ data, info }) => {
                        say(krystal, msg.channel, { content: text, files: [new MessageAttachment(data)] });
                    });
            });
    }
}

export function testCommands(msg: Message) {
    let args = getArgs(msg.content);
    if (testWord(args, "krystal", "krystal")) {
        if (testWord(args, "kill", "beat", "punch", "heal", "shoot", "attack", "unalive", "protect", "exterminate")) return killing(msg);
        greet(msg);
    }
}
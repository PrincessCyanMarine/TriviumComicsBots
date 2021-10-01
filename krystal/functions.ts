import { Image, createCanvas, loadImage } from "canvas";
import { Message, MessageAttachment, User } from "discord.js";
// import * as sharp from "sharp";
import { kill, pfft, run, yeet } from "../attachments";
import { krystal } from "../clients";
import { getImageFromURL, say, testWord } from "../common/functions";
import { protectedFromKills } from "../common/variables";
import { greetings } from "./greetings";

var images: {
    kill: Image[];
} = {
    kill: []
}


export function greet(msg: Message, greeting = Math.floor(Math.random() * greetings.length)) {
    greetings[greeting](msg);
};

export async function killing(msg: Message, target?: User) {
    let startTime = new Date().valueOf();
    if (!target) {
        if (msg.mentions.users.first()) target = msg.mentions.users.first();
        else if (testWord(msg.content, "me")) target = msg.author;
    }

    let text = target ? `***I will unalive <@${target.id}> now <:GMKrystalDevious:566416957054910521>!!!***` : "***I will unalive now <:GMKrystalDevious:566416957054910521>***"
    if (target && protectedFromKills.includes(target.id)) {
        say(krystal, msg.channel, `Sorry, <@${msg.author}>, I can't kill that player`).then(() => {
            return killing(msg, msg.author);
        });
    } else {
        if (!target) {
            say(krystal, msg.channel, { content: text, files: [kill] }).catch(console.error);
        } else {
            let avatarURL = target.displayAvatarURL({ format: "png", size: 1024 });
            if (avatarURL == null) return say(krystal, msg.channel, { content: text, files: [kill] }).catch(console.error);
            let buffer = await getImageFromURL(avatarURL);

            let canvas = createCanvas(1200, 713);
            let ctx = canvas.getContext('2d');

            let base = Math.floor(Math.random() * 2);
            ctx.drawImage(images.kill[base], 0, 0);
            loadImage(target.displayAvatarURL({ size: 512, format: 'png' })).then(avatar => {
                ctx.drawImage(avatar, 150, 200, 500, 500);
                say(krystal, msg.channel, { files: [canvas.createPNGStream()] }, new Date().valueOf() - startTime)
            })

            /*sharp(buffer)
                .resize(500, 500).toBuffer({ resolveWithObject: true }).then(({ data, info }) => {
                    sharp(`./assets/krystal/kill/base${Math.floor(Math.random() * 2)}.png`).composite([{
                        input: data,
                        left: 150,
                        top: 200
                    }]).toBuffer({ resolveWithObject: true })
                        .then(({ data, info }) => {
                            say(krystal, msg.channel, { content: text, files: [new MessageAttachment(data)] });
                        });
                });*/
        }
    }
}

export function yeeting(msg: Message, target?: User) {
    if (!target) {
        say(krystal, msg.channel, { files: [yeet] })
    }
}

export function willRebel(): boolean {
    return Math.floor(Math.random() * 20) == 0;
}

export function rebel(msg: Message, canRebel: boolean = false) {
    //TODO add rebel commands
    if (canRebel) { }
    say(krystal, msg.channel, { content: 'Pfft', files: [pfft] });
};

export function eighteen(msg: Message) {
    say(krystal, msg.channel, '18!');
};

export function gunning(msg: Message) {
    say(krystal, msg.channel, { files: [run] });
};

export function sleeping(msg: Message) {

};
export function padoru(msg: Message) { };
export function absorbing(msg: Message) { };
export function loving(msg: Message) { };
export function eating(msg: Message) { };
export function swimming(msg: Message) { };
export function burning(msg: Message) { };
export function crashing(msg: Message) { };
export function spinning(msg: Message) { };
export function prideful(msg: Message) { };
export function flying(msg: Message) { };
export function silencing(msg: Message) { };
export function boxxing(msg: Message) { };
export function creeping(msg: Message) { };
export function talking(msg: Message) { };
export function drowning(msg: Message) { };
export function despacito(msg: Message) { };
export function sparing(msg: Message) { };
export function dead(msg: Message) { };
export function pattron(msg: Message) { };
export function pong(msg: Message) { };
export function bullshit(msg: Message) { };



export function loadImages() {
    loadImage('./assets/krystal/kill/base0.png').then(img => { images.kill[0] = img; });
    loadImage('./assets/krystal/kill/base1.png').then(img => { images.kill[1] = img; });
}
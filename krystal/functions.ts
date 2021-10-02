import { Image, createCanvas, loadImage } from "canvas";
import { Message, MessageAttachment, User } from "discord.js";
// import * as sharp from "sharp";
import { kill, pfft, run, yeet } from "../attachments";
import { krystal } from "../clients";
import { say, testWord } from "../common/functions";
import { protectedFromKills } from "../common/variables";
import { greetings } from "./greetings";

var images: {
    kill: Image[];
} = {
    kill: []
}


export function greet(msg: Message, greeting = Math.floor(Math.random() * greetings.length)) { greetings[greeting](msg); };

export function yeeting(msg: Message, target?: User) { if (!target) say(krystal, msg.channel, { files: [yeet] }) };

export function willRebel(): boolean { return Math.floor(Math.random() * 20) == 0; };

export function eighteen(msg: Message) { say(krystal, msg.channel, '18!'); };

export function gunning(msg: Message) { say(krystal, msg.channel, { files: [run] }); };

export function killing(msg: Message, target?: User, revengekill: Boolean = false): any {
    let startTime = new Date().valueOf();
    if (!target) {
        if (msg.mentions.users.first()) target = msg.mentions.users.first();
        else if (testWord(msg.content, "me")) target = msg.author;
    }

    if (!revengekill && Math.floor(Math.random() * 10) == 0) return say(krystal, msg.channel, ':GMKrystalDevious: I do not condone suicide')

    let text = revengekill ? `Sorry, <@${msg.author}>, Sadie asked me to spare that player` : target ? `***I will unalive <@${target.id}> now :GMKrystalDevious:!!!***` : `***I will unalive now :GMKrystalDevious:***`

    if (!target) return say(krystal, msg.channel, { content: text, files: [kill] }).catch(console.error);
    if (protectedFromKills.includes(target.id)) return killing(msg, msg.author, true);

    let avatarURL = target.displayAvatarURL({ format: "png", size: 1024 });
    if (avatarURL == null) return say(krystal, msg.channel, { content: text, files: [kill] }).catch(console.error);

    let canvas = createCanvas(1200, 713);
    let ctx = canvas.getContext('2d');

    let base = Math.floor(Math.random() * 2);
    loadImage(`./assets/krystal/kill/base${base}.png`).then(bg => {
        if (target) loadImage(target.displayAvatarURL({ size: 512, format: 'png' })).then(avatar => {
            ctx.drawImage(bg, 0, 0);
            ctx.drawImage(avatar, 150, 200, 500, 500);
            say(krystal, msg.channel, { content: text, files: [new MessageAttachment(canvas.toBuffer(), 'Kill.png')] }, new Date().valueOf() - startTime)
        })
    })
};

export function rebel(msg: Message, canRebel: boolean = false) {
    //TODO add rebel commands
    if (canRebel) { }
    say(krystal, msg.channel, { content: 'Pfft', files: [pfft] });
};

export function sleeping(msg: Message) { };
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
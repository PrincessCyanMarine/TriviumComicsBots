import { Image, createCanvas, loadImage } from "canvas";
import { Message, MessageAttachment, User } from "discord.js";
import assets from "../assetsIndexes";
// import * as sharp from "sharp";
import { absorb, kill, pfft, run, sleep, yeet } from "../attachments";
import { krystal } from "../clients";
import { getTarget, say, testWord } from "../common/functions";
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

export function killing(msg: Message, target: User | undefined = getTarget(msg), revengekill: Boolean = false): any {
    let startTime = new Date().valueOf();


    if (!revengekill && Math.floor(Math.random() * 10) == 0) return say(krystal, msg.channel, ':GMKrystalDevious: I do not condone suicide')

    let text = revengekill ? `Sorry, <@${msg.author}>, Sadie asked me to spare that player` : target ? `***I will unalive <@${target.id}> now :GMKrystalDevious:!!!***` : `***I will unalive now :GMKrystalDevious:***`

    if (!target) return say(krystal, msg.channel, { content: text, files: [kill] }).catch(console.error);
    if (protectedFromKills.includes(target.id)) return killing(msg, msg.author, true);

    let avatarURL = target.displayAvatarURL({ format: "png", size: 1024 });
    if (avatarURL == null) return say(krystal, msg.channel, { content: text, files: [kill] }).catch(console.error);

    let canvas = createCanvas(1200, 713);
    let ctx = canvas.getContext('2d');

    let base = Math.floor(Math.random() * 2);
    loadImage(assets.krystal.kill[base]).then(bg => {
        if (target) loadImage(avatarURL).then(avatar => {
            ctx.drawImage(bg, 0, 0);
            ctx.drawImage(avatar, 150, 200, 500, 500);
            say(krystal, msg.channel, { content: text, files: [new MessageAttachment(canvas.toBuffer(), 'Kill.png')] }, 1000 - (new Date().valueOf() - startTime))
        })
    })
};

export function rebel(msg: Message, canRebel: boolean = false) {
    //TODO add rebel commands
    if (canRebel) { }
    say(krystal, msg.channel, { content: 'Pfft', files: [pfft] });
};

export function sleeping(msg: Message, target: User | undefined = getTarget(msg)) {
    if (!target) return say(krystal, msg.channel, { files: [sleep] });
    let startTime = new Date().valueOf();


    let canvas = createCanvas(361, 303);
    let ctx = canvas.getContext('2d');

    let avatarURL = target.displayAvatarURL({ format: 'jpeg', size: 1024 });
    loadImage(assets.krystal.sleep).then(top => {
        loadImage(avatarURL).then(avatar => {
            ctx.drawImage(avatar, 95, 38, 121, 121);
            ctx.drawImage(top, 0, 0);
            say(krystal, msg.channel, { files: [canvas.toBuffer()] }, 1000 - (new Date().valueOf() - startTime));
        })
    })
};
export function absorbing(msg: Message, target: User | undefined = getTarget(msg)) {
    if (!target) return say(krystal, msg.channel, { files: [absorb] });

    let startTime = new Date().valueOf();


    let canvas = createCanvas(1297, 707);
    let ctx = canvas.getContext('2d');

    let avatarURL = target.displayAvatarURL({ format: 'png', size: 1024 });
    loadImage(assets.krystal.absorb).then(bg => {
        loadImage(avatarURL).then(avatar => {
            ctx.drawImage(bg, 0, 0);
            ctx.drawImage(avatar, 82, 98, 512, 512);
            say(krystal, msg.channel, { files: [canvas.toBuffer()] }, 1000 - (new Date().valueOf() - startTime));
        })
    })
};
export function loving(msg: Message) { };
export function eating(msg: Message) { };
export function swimming(msg: Message) { };
export function burning(msg: Message) { };
export function crashing(msg: Message) { };
export function spinning(msg: Message) { };
export function prideful(msg: Message) { };
export function flying(msg: Message) { };
export function silencing(msg: Message) { };
export function boxxing(msg: Message, target: User | undefined = getTarget(msg)) { };
export function creeping(msg: Message) { };
export function talking(msg: Message) { };
export function drowning(msg: Message, target: User | undefined = getTarget(msg)) { };
export function despacito(msg: Message) { };
export function sparing(msg: Message) { };
export function dead(msg: Message) { };
export function pattron(msg: Message) { };
export function pong(msg: Message) { };
export function bullshit(msg: Message) { };
export function padoru(msg: Message) { };

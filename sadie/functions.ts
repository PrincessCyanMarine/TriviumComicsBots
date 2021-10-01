import { createCanvas, Image, loadImage } from "canvas";
import { Client, Message, MessageAttachment, User } from "discord.js";
import GIFEncoder from "gifencoder";
import { Writable } from "stream";
import { sadie } from "../clients";
import { createEncoder, say, testWord } from "../common/functions";
import { greetings } from "./greetings";
import fs from 'fs';

var images: {
    punch: Image[]
} = {
    punch: []
};

export function greet(msg: Message, greeting = Math.floor(Math.random() * greetings.length)) {
    greetings[greeting](msg);
};

export function bestwaifu(msg: Message) {
    if (testWord(msg.content, 'isnt', 'not', 'trash', 'worst')) {
        say(sadie, msg.channel, 'Oh, dumb are we?\nI\'m top bitch, you Weeb!');
        //TODO Door close GIF
    } else {
        say(sadie, msg.channel, 'Damn right! I am the best waifu');
    }
}

export function weeb(msg: Message) {
    let target: User | undefined = msg.mentions.users.first();
    if (!target) return;
    if (sadie.user && target.id == sadie.user.id) {
        say(sadie, msg.channel, 'I\'m no weeb, you weeb').then(() => {
            punching(msg, msg.author);
        });
    } else
        say(sadie, msg.channel, `Of course <@${target.id}> is a Weeb!\nEveryone here, except for me, is a Weeb, Weeb!`);
}

export function punching(msg: Message, target?: User) {
    let startTime = new Date().valueOf();
    if (!target)
        if (msg.mentions.users.first()) target = msg.mentions.users.first();
        else if (testWord(msg.content, 'me')) target = msg.author;

    if (target) {
        let width = 486;
        let height = 352;

        let { encoder, stream } = createEncoder(width, height);
        let canvas = createCanvas(width, height);
        let ctx = canvas.getContext('2d');
        let i: number;
        let buf: any[] | Uint8Array[] = [];
        stream.on('data', function (d) { buf.push(d); });
        stream.on('end', function () {
            let buffer = Buffer.concat(buf);
            say(sadie, msg.channel, { files: [new MessageAttachment(buffer, 'Punch.gif')] }, new Date().valueOf() - startTime - startTime);
            stream.destroy();
        })
        loadImage(target.displayAvatarURL({ format: 'png', size: 256 })).then(avatar => {
            for (i = 0; i <= 4; i++)
                if (i == 4) {
                    encoder.finish();
                }
                else {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(avatar, 2, 86, 177, 177);
                    ctx.drawImage(images.punch[i], 0, 0, width, height);
                    encoder.addFrame(ctx);
                }
        });
    }
}

export function dm(msg: Message) {
    say(sadie, msg.channel, 'I already got my own group of idiots to DM.\nGo ask someone else.');
}
export function kick(msg: Message) { }
export function tsundere(msg: Message) { }
export function padoru(msg: Message) { }




export function loadImages(i: number = 0) {
    loadImage(`./assets/sadie/punch/${i}.png`).then(img => {
        images.punch.push(img);
        if (i < 3) loadImages(i + 1);
    });
}

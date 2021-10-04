import { createCanvas, Image, loadImage } from "canvas";
import { Message, MessageAttachment, User } from "discord.js";
import { sadie } from "../clients";
import { createEncoder, getTarget, say, testWord } from "../common/functions";
import { greetings } from "./greetings";
import { protectedFromKills } from "../common/variables";
import assets from "../assetsIndexes";
import { database } from "..";
import { kick, punch } from "../attachments";

var images: {
    punch: Image[]
} = {
    punch: []
};

export function greet(msg: Message, greeting = Math.floor(Math.random() * greetings.length)) { greetings[greeting](msg); };

export function bestwaifu(msg: Message) {
    let startTime = new Date().valueOf();

    if (testWord(msg.content, 'isnt', 'not', 'trash', 'worst')) {
        let width = 1000,
            height = 676;

        let { encoder, canvas, ctx } = createEncoder(width, height, (buffer) => {
            say(sadie, msg.channel, { content: 'Oh, dumb are we?\nI\'m top bitch, you Weeb!', files: [new MessageAttachment(buffer, 'Door.gif')] }, 1000 - new Date().valueOf() - startTime);
        }, { delay: 4500, repeat: -1 });

        let avatarURL = msg.author.displayAvatarURL({ format: 'png', size: 1024 });
        loadImage(avatarURL).then((avatar) => {
            loadImage(assets.sadie.door.open).then((openDoor) => {
                loadImage(assets.sadie.door.closed).then((closedDoor) => {
                    ctx.drawImage(closedDoor, 0, 0);
                    ctx.rotate(16.25 * Math.PI / 180);
                    ctx.drawImage(avatar, 425, 100, 100, 100);
                    ctx.rotate(-16.25 * Math.PI / 180);
                    encoder.addFrame(ctx);

                    ctx.drawImage(openDoor, 0, 0);
                    ctx.drawImage(avatar, 297, 55, 100, 100);
                    encoder.addFrame(ctx);
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    encoder.finish();
                })
            })
        })
    } else {
        say(sadie, msg.channel, 'Damn right! I am the best waifu');
    }
}

export function weeb(msg: Message) {
    let target: User | undefined = msg.mentions.users.first();
    if (!target) return say(sadie, msg.channel, `Everyone here, except for me, is a Weeb, Weeb!`);
    if (sadie.user && target.id == sadie.user.id) {
        say(sadie, msg.channel, 'I\'m no weeb, you weeb').then(() => {
            punching(msg, msg.author);
        });
    } else
        say(sadie, msg.channel, `Of course <@${target.id}> is a Weeb!\nEveryone here, except for me, is a Weeb, Weeb!`);
}

export function punching(msg: Message, target: User | undefined = getTarget(msg), revengekill = false): any {
    let startTime = new Date().valueOf();


    if (!target) return say(sadie, msg.channel, { files: [punch] })
    if (protectedFromKills.includes(target.id)) return punching(msg, msg.author, true);
    let width = 486;
    let height = 352;

    let { encoder, canvas, ctx } = createEncoder(width, height, (buffer) => {
        say(sadie, msg.channel, { content: revengekill ? 'I would much rather punch you!' : 'My pleasure!', files: [new MessageAttachment(buffer, 'Punch.gif')] }, 1000 - new Date().valueOf() - startTime)
    });

    loadImage(target.displayAvatarURL({ format: 'png', size: 1024 })).then(avatar => {
        loadImage(assets.sadie.punch[0]).then(img0 => {
            loadImage(assets.sadie.punch[1]).then(img1 => {
                loadImage(assets.sadie.punch[2]).then(img2 => {
                    loadImage(assets.sadie.punch[3]).then(img3 => {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(avatar, 2, 86, 177, 177);
                        ctx.drawImage(img0, 0, 0, width, height);
                        encoder.addFrame(ctx);

                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(avatar, 2, 86, 177, 177);
                        ctx.drawImage(img1, 0, 0, width, height);
                        encoder.addFrame(ctx);

                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(avatar, 2, 86, 177, 177);
                        ctx.drawImage(img2, 0, 0, width, height);
                        encoder.addFrame(ctx);

                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(avatar, 2, 86, 177, 177);
                        ctx.drawImage(img3, 0, 0, width, height);
                        encoder.addFrame(ctx);

                        encoder.finish();
                    });
                });
            });
        });
    });
}


export function dm(msg: Message) { say(sadie, msg.channel, 'I already got my own group of idiots to DM.\nGo ask someone else.'); }

export async function kicking(msg: Message, target: User | undefined = getTarget(msg)) {
    if (!target) return say(sadie, msg.channel, { files: [kick] });
    let startTime = new Date().valueOf();

    let canvas = createCanvas(868, 587);
    let ctx = canvas.getContext('2d');
    let saveavatar_canvas = createCanvas(256, 256);
    let saveavatar_ctx = saveavatar_canvas.getContext('2d');

    let ki1 = await (await database.child('canvas_ki1').once('value')).val();
    let ki2 = await (await database.child('canvas_ki2').once('value')).val();
    let avatarURL = target.displayAvatarURL({ format: 'png', size: 1024 });
    loadImage('./assets/sadie/kick/kick.png').then(bg => {
        loadImage(avatarURL).then(avatar => {
            loadImage(ki1).then(avatar1 => {
                loadImage(ki2).then(avatar2 => {
                    saveavatar_ctx.drawImage(avatar, 0, 0);
                    ctx.drawImage(bg, 0, 0);
                    ctx.drawImage(avatar1, 78, 79, 72, 72);
                    ctx.drawImage(avatar, 341, 57, 191, 191);
                    ctx.drawImage(avatar2, 706, 37, 71, 71);
                    say(sadie, msg.channel, { files: [new MessageAttachment(canvas.toBuffer(), 'Kick.png')] }, 1000 - (new Date().valueOf() - startTime));
                    database.child('canvas_ki1').set(saveavatar_canvas.toDataURL());
                    database.child('canvas_ki2').set(ki1);
                })
            })
        })
    })
}

export function tsundere(msg: Message) { }

export function padoru(msg: Message) { }
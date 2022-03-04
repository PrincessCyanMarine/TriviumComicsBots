import { userMention } from "@discordjs/builders";
import axios from "axios";
import { createCanvas, Image, loadImage } from "canvas";
import { GuildMember, Message, MessageAttachment, User, Widget } from "discord.js";
import { database } from "..";
import assets from "../assetsIndexes";
import {
    absorb,
    box,
    drown,
    fire,
    fireball,
    fly,
    glitch,
    inhale,
    kill,
    lamp,
    moe,
    patreon,
    pfft,
    popcorn,
    pride,
    run,
    sleep,
    speak,
    spin,
    swim,
    swimsadie,
    vanquishFly,
    yeet,
} from "../attachments";
import { eli, krystal, ray, sadie } from "../clients";
import {
    argClean,
    getMember,
    getTarget,
    imageCommand,
    notificationCult,
    random_from_array,
    randomchance,
    say,
    testWord,
    wait,
    createEncoder,
    getTargetMember,
} from "../common/functions";
import { announcementChannelId, marinaId, patreon_roles, protectedFromKills } from "../common/variables";
import { greetings } from "./greetings";

const yeetFrames: Image[] = [];
const yeetOverlays: { [overlay: string]: Image } = {};
var altYeetFrame1: Image;
(async () => {
    altYeetFrame1 = await loadImage(assets.krystal.yeet.frames + "_1.png");
    ["1", "6", "7"].forEach(async (i) => {
        yeetOverlays[i] = await loadImage(assets.krystal.yeet.overlay + i + ".png");
    });
    for (let i = 0; i <= 7; i++) {
        let path = assets.krystal.yeet.frames + i + ".png";
        loadImage(path).then((frame) => {
            yeetFrames[i] = frame;
        });
    }
})();

export var spared_player_id: string;
(async () => {
    spared_player_id = await (await database.child("dontattack").once("value")).val();
})();
database.child("dontattack").on("value", (s) => {
    spared_player_id = s.val();
});

export function greet(msg: Message, greeting = Math.floor(Math.random() * greetings.length)) {
    greetings[greeting](msg);
}
export async function yeeting(msg: Message, target: GuildMember | undefined = getTargetMember(msg)) {
    let startTime = Date.now().valueOf();
    msg.channel.sendTyping();
    let [width, height] = [1000, 676];
    let { ctx, canvas, encoder } = createEncoder(
        width,
        height,
        (buffer) => say(krystal, msg.channel, { files: [new MessageAttachment(buffer, "yeet.gif")] }, startTime - Date.now().valueOf()),
        { delay: 1000 }
    );

    let avatar = await loadImage(
        msg.member ? msg.member.displayAvatarURL({ format: "png", size: 1024 }) : msg.author.displayAvatarURL({ format: "png", size: 1024 })
    );

    let target_avatar: Image;
    if (target) target_avatar = await loadImage(target.displayAvatarURL({ format: "png", size: 1024 }));

    const drawYeetFrame = async (i: number) => {
        let frame = yeetFrames[i];
        // console.time(i.toString());
        if (target && i == 1) {
            ctx.drawImage(altYeetFrame1, 0, 0, width, height);
            ctx.drawImage(target_avatar, 110, 18, 159, 159);
            ctx.drawImage(yeetOverlays["1"], 0, 0, width, height);
        } else ctx.drawImage(frame, 0, 0, width, height);

        if (i >= 6) {
            ctx.drawImage(avatar, 13, 17, 584, 584);
            if (i == 7) {
                // https://stackoverflow.com/a/53365073
                let imgData = ctx.getImageData(13, 17, 584, 584);
                let pixels = imgData.data;
                for (let i = 0; i < pixels.length; i += 4) {
                    let lightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;

                    pixels[i] = lightness;
                    pixels[i + 1] = lightness;
                    pixels[i + 2] = lightness;
                }
                ctx.putImageData(imgData, 13, 17);
            }
            ctx.drawImage(yeetOverlays[i.toString()], 0, 0, width, height);
        }
        encoder.addFrame(ctx as CanvasRenderingContext2D);
        // console.timeEnd(i.toString());
        if (i < 7) drawYeetFrame(i + 1);
        else encoder.finish();
    };

    drawYeetFrame(0);
}
export function willRebel(): boolean {
    return Math.floor(Math.random() * 20) == 0;
}
export function eighteen(msg: Message) {
    say(krystal, msg.channel, "18!");
}
export function gunning(msg: Message) {
    say(krystal, msg.channel, { files: [run] });
}
export function creeping(msg: Message) {
    say(krystal, msg.channel, { files: [moe] });
}
export function loving(msg: Message) {
    say(krystal, msg.channel, `I'm sorry, ${msg.member?.displayName} Your Princess is in another castle.`);
}
export function spinning(msg: Message) {
    say(krystal, msg.channel, { files: [spin] });
}
export function prideful(msg: Message) {
    say(krystal, msg.channel, { files: [pride] });
}
export function pong(msg: Message) {
    msg.channel.send("Pong!");
}
export function bullshit(msg: Message) {
    say(krystal, msg.channel, "Cow poopy");
}

export function killing(
    msg?: Message,
    target: User | undefined = msg ? getTarget(msg) : undefined,
    type: "normal" | "revenge" = "normal",
    text?: string
): Promise<Buffer | MessageAttachment> {
    return new Promise((resolve, reject) => {
        let startTime = new Date().valueOf();

        let avatarURL: string;
        if (msg) {
            if (!text)
                text =
                    type == "revenge"
                        ? `Sorry, <@${msg.author.id}>, Sadie asked me to spare that player`
                        : target
                        ? `***I will unalive <@${target.id}> now :GMKrystalDevious:!!!***`
                        : `***I will unalive now :GMKrystalDevious:***`;

            if (!target) return say(krystal, msg.channel, { content: text, files: [kill] }).catch(console.error);
            if (type != "revenge" && msg.author.id == target.id && Math.floor(Math.random() * 10) == 0)
                return say(krystal, msg.channel, ":GMKrystalDevious: I do not condone suicide");
            if (protectedFromKills.includes(target.id)) return killing(msg, msg.author, "revenge");
            if (target.id == spared_player_id)
                return say(krystal, msg.channel, `Sorry, <@${msg.author.id}>, I was asked to spare that unattractive weeb`);
            avatarURL = target.displayAvatarURL({ format: "png", size: 1024 });
            if (avatarURL == null) return say(krystal, msg.channel, { content: text, files: [kill] }).catch(console.error);
        } else if (target) avatarURL = target.displayAvatarURL({ format: "png", size: 1024 });
        else return resolve(kill);

        let canvas = createCanvas(1200, 713);
        let ctx = canvas.getContext("2d");

        let base = Math.floor(Math.random() * 2);
        loadImage(assets.krystal.kill[base]).then((bg) => {
            if (target)
                loadImage(avatarURL).then((avatar) => {
                    ctx.drawImage(bg, 0, 0);
                    ctx.drawImage(avatar, 150, 200, 500, 500);
                    if (msg)
                        say(
                            krystal,
                            msg.channel,
                            { content: text, files: [new MessageAttachment(canvas.toBuffer(), "Kill.png")] },
                            1000 - (new Date().valueOf() - startTime)
                        );
                    else resolve(canvas.toBuffer());
                });
        });
    });
}
/**
 * TODO add rebel commands
 */
export async function rebel(msg: Message, canRebel: boolean = false) {
    let img: Buffer | MessageAttachment;
    if (canRebel && randomchance(30))
        img = await random_from_array([
            killing,
            drowning,
            boxxing,
            silencing,
            silencedbox,
            sleeping,
            eating,
            absorbing,
            // swimming
            // yeeting,
            // burning,
            // crashing,
            // spinning,
            // prideful,
            // flying,
            // talking,
            // gunning,
            // creeping,
            //TODO rockpaperscissors
        ])(undefined, msg.author);
    else img = pfft;

    say(krystal, msg.channel, { content: "Pfft", files: [img] });
}
export function sleeping(msg: Message | undefined, target: User | undefined = msg ? getTarget(msg) : undefined): Promise<Buffer | MessageAttachment> {
    return new Promise((resolve, reject) => {
        imageCommand(
            krystal,
            msg,
            target,
            361,
            303,
            {
                x: 95,
                y: 38,
                width: 121,
                height: 121,
            },
            undefined,
            assets.krystal.sleep,
            sleep
        )
            .then(resolve)
            .catch(reject);
    });
}
export function absorbing(msg?: Message, target: User | undefined = msg ? getTarget(msg) : undefined): Promise<MessageAttachment | Buffer> {
    return new Promise((resolve, reject) => {
        imageCommand(krystal, msg, target, 1297, 707, { x: 82, y: 98, width: 512, height: 512 }, assets.krystal.absorb, undefined, absorb)
            .then(resolve)
            .catch(reject);
    });
}
export function eating(msg?: Message, target: User | undefined = msg ? getTarget(msg) : undefined): Promise<MessageAttachment | Buffer> {
    return new Promise((resolve, reject) => {
        imageCommand(
            krystal,
            msg,
            target,
            1200,
            713,
            { x: 125, y: 200, width: 500, height: 500 },
            assets.krystal.popcorn.base,
            assets.krystal.popcorn.top,
            popcorn
        )
            .then(resolve)
            .catch(reject);
    });
}

export async function drowning(
    msg: Message | undefined,
    target: User | undefined = msg ? getTarget(msg) : undefined
): Promise<Buffer | MessageAttachment> {
    return new Promise(async (resolve, reject) => {
        let img: Buffer | MessageAttachment;
        if (target) {
            let canvas = createCanvas(833, 762);
            let ctx = canvas.getContext("2d");
            let avatarURL = target.displayAvatarURL({ size: 1024, format: "png" });
            let avatar = await loadImage(avatarURL);
            let bg = await loadImage(assets.krystal.drown.base);
            let top = await loadImage(assets.krystal.drown.top);
            ctx.drawImage(bg, 0, 0);
            ctx.rotate((36 * Math.PI) / 180);
            ctx.drawImage(avatar, 442, -306, 200, 200);
            ctx.rotate((-36 * Math.PI) / 180);
            ctx.drawImage(top, 0, 0);
            img = canvas.toBuffer();
        } else img = drown;
        if (msg) await say(krystal, msg.channel, { files: [img] });
        resolve(img);
    });
}

export function swimming(msg: Message) {
    if (msg.member?.displayName.toLowerCase() == "sadie") say(krystal, msg.channel, { files: [swimsadie] });
    else say(krystal, msg.channel, { files: [swim] });
}
export async function burning(msg?: Message): Promise<MessageAttachment> {
    return new Promise(async (resolve, reject) => {
        let activity = await (await database.child("activities/Krystal").once("value")).val();
        if (activity == "dnd")
            if (msg) say(krystal, msg.channel, { files: [fireball] });
            else return resolve(fireball);
        else if (msg) say(krystal, msg.channel, { files: [fire] });
        else return resolve(fire);
    });
}
export async function crashing(msg: Message) {
    let channel = msg.channel;
    let message = await say(krystal, channel, "Invalid result...");
    let delay = 500;
    await wait(delay / 2);
    for (let i = 0; i <= 1500; i += delay) {
        await message.edit("Krystal.exe stopped responding!\nRestarting" + "".padEnd(((i / delay) % 3) + 1, "."));
        await wait(i);
        if (i == 1500) {
            message.edit("Failed to restart!\nCorrupted file: *ķ̴̱͍͇̝̫͙͇̘̇́͆̏͝ŗ̶̛̪̹̻̼͈̯͔͖̥̜̺̙̠͂͒́̎͊̿͗̂͜͝y̷̢̟͍̫̥͕̞̟̳͓̦̻̅̓̄͒͗̾̕͝ͅs̸̨̛̘̭̦̥̍̿́̇̀͛̆̏̎͋t̷̗̫̘̠͉̝̣̐̀̊̎̎͊̅̿̀̌͊a̴̘̮͔͎̫̠̻̲̜͎̪͉̾̇̐̍̔̂͝ͅl̶͇̽̒̇̿̊̔̀̑̀̑̿̚͠.̷̡̫͎̈͛̄̈́̈́̓̓̿̓̾͘̕͠ę̸̙͉̺͓͚͉̺̯͉̮̽̿́x̶̡̢̛̖̲̻̪͇̝͉̫̖̯̬͙̌́͗́͝͠e̶̼̯̺͎̫̻̳͖͚̤̿̅̈́̓̃͒*");
            message.edit({ files: [glitch] });
        }
    }
}
export function flying(msg: Message) {
    if (testWord(msg.content, "vanquish")) say(krystal, msg.channel, { files: [vanquishFly] });
    else say(krystal, msg.channel, { files: [fly] });
}

export function silencedbox(
    msg: Message | undefined,
    target: User | undefined = msg ? getTarget(msg) : undefined
): Promise<Buffer | MessageAttachment> {
    return new Promise(async (resolve, reject) => {
        imageCommand(
            krystal,
            msg,
            target,
            1754,
            1573,
            {
                x: 621,
                y: 494,
                width: 465,
                height: 465,
            },
            undefined,
            random_from_array(assets.krystal.boxlamp)
        )
            .then(resolve)
            .catch(reject);
    });
}

/**
 * TODO silence
 */
export function silencing(
    msg: Message | undefined,
    target: User | undefined = msg ? getTarget(msg) : undefined
): Promise<Buffer | MessageAttachment> {
    return new Promise(async (resolve, reject) => {
        imageCommand(
            krystal,
            msg,
            target,
            273,
            369,
            {
                x: 17,
                y: 129,
                width: 240,
                height: 240,
            },
            undefined,
            assets.krystal.lamp,
            lamp
        )
            .then(resolve)
            .catch(reject);
    });
}

export function boxxing(msg?: Message, target: User | undefined = msg ? getTarget(msg) : undefined): Promise<Buffer | MessageAttachment> {
    return new Promise(async (resolve, reject) => {
        imageCommand(
            krystal,
            msg,
            target,
            1754,
            1240,
            {
                x: 621,
                y: 161,
                width: 465,
                height: 465,
            },
            undefined,
            assets.krystal.box,
            box
        )
            .then(resolve)
            .catch(reject);
    });
}
/**
 * TODO silence
 */
export function talking(msg: Message) {
    say(krystal, msg.channel, { files: [speak] });
}
export function despacito(msg: Message) {
    let messages = ["What's a despacito...?", "Alexa, play despacito!"];
    say(krystal, msg.channel, messages[Math.floor(Math.random() * messages.length)]);
}
export function dead(msg: Message, target: GuildMember | undefined = getMember(msg)) {
    if (!target) return say(krystal, msg.channel, `It has expired!`);
    say(krystal, msg.channel, `${target.displayName} has expired!`);
}
export function pattron(msg: Message, target: GuildMember | undefined = getMember(msg)) {
    if (target)
        patreon_roles.forEach((role) => {
            if (target.roles.cache.has(role)) return say(krystal, msg.channel, `Thanks for being a supporter, <@${target.id}>`);
        });
    say(krystal, msg.channel, { content: "Support!\nSupport!\nSupport!\nSupport!", files: [patreon] });
}

export function sparing(msg: Message, target: User | undefined = getTarget(msg)) {
    if (!target) return say(krystal, msg.channel, "Which unattractive weeb should I spare?");
    say(krystal, msg.channel, "Understood, I will spare the unattractive weeb");
    database.child("dontattack").set(target.id);
}

export async function testWebtoonEpisode() {
    try {
        let mostRecentEpisode = await (await database.child("mostRecentEpisode").once("value")).val();
        let response = await axios.get("https://www.webtoons.com/en/challenge/game-masters/list?title_no=237252");

        let webtoonEpisode: RegExpMatchArray | null | string = response.data.match(/<ul id="_listUl">[\s\S]+?<\/ul>/);
        if (!webtoonEpisode) return;
        webtoonEpisode = webtoonEpisode[0];
        if (typeof webtoonEpisode != "string") return;

        let episode_number = parseInt(webtoonEpisode.split('data-episode-no="')[1].split('"')[0]);
        if (mostRecentEpisode >= episode_number) return;
        database.child("mostRecentEpisode").set(episode_number);
        let announcers = ["Sadie", "Ray", "Eli", "Angel", "Kairi"];
        let episode_title = webtoonEpisode.split('<span class="subj"><span>')[1].split("</span>")[0];
        let episode_url = webtoonEpisode.split('<a href="')[1].split('" class="')[0];

        // console.log(episode_number);
        // console.log(episode_title);
        // console.log(episode_url);

        say(
            krystal,
            announcementChannelId,
            `<@&774127564675481600>, ${
                announcers[Math.floor(Math.random() * announcers.length)]
            } asked me to tell you that a new Game Masters episode called *${episode_title}* is now up \n\n You can read it at \n${episode_url} \n\n Feel free to discuss the episode here or on reddit \n https://www.reddit.com/r/TriviumComics/`,
            1
        ).catch(console.error);
        notificationCult("562429294090125330");
    } catch (err) {
        console.error(err);
    }
}

export function nonowords(msg: Message) {
    const sadieAngry = async () => {
        await say(
            sadie,
            msg.channel,
            `God f\\*\\*\\*\\*\\*\\* d\\*\\*\\*\\*\\*, ${userMention(
                msg.author.id
            )}. You f\\*\\*\\*\\*\\*\\* dumb piece of r\\*\\*\\*\\*\\*\\*\\* s\\*\\*\\*`
        );
        await say(krystal, msg.channel, { files: [inhale] });
        await say(sadie, msg.channel, "KRYSTAL, NO!!", 300);
    };
    let nono = argClean(msg.content).match(
        /(?<![A-Z0-9])(((([fdm]u)c?k)|(fack))((ing)|(ed)|(ers?)?)|ass|dumbass|asshole|shit((face)|(ing))?|dam[mn]((it)|(ed))?|cock|cunt|simp|boomer|hell|f(a|u)(k|c))(?![A-Z0-9])/gi
    );
    if (!nono) return;
    let res: string[] = [];
    nono.forEach((a) => {
        if (randomchance(30)) res.push(a.toUpperCase());
    });
    if (res.length > 0)
        say(krystal, msg.channel, res.join(" ")).then(() => {
            if (res.length > 2) sadieAngry();
            else if (randomchance()) sadieAngry();
        });
}

export function thankMarin(msg: Message, reg: RegExpMatchArray) {
    say(random_from_array([krystal, sadie, ray, eli]), msg.channel, `Thanks, ${reg[1]}!`);
}

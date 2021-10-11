import { createCanvas, loadImage } from "canvas";
import { GuildMember, Interaction, Message, MessageAttachment, User } from "discord.js";
import got from "got/dist/source";
import { database } from "..";
import assets from "../assetsIndexes";
import { absorb, box, drown, fire, fly, glitch, kill, lamp, moe, patreon, pfft, popcorn, pride, run, sleep, speak, spin, swim, swimsadie, vanquishFly, yeet } from "../attachments";
import { krystal } from "../clients";
import { edit, getMember, getTarget, notificationCult, say, testWord } from "../common/functions";
import { announcementChannelId, patron_role_id, protectedFromKills } from "../common/variables";
import { greetings } from "./greetings";

var spared_player_id: string;
(async () => {
    spared_player_id = await (await database.child('dontattack').once('value')).val();
})();
database.child('dontattack').on('value', (s) => { spared_player_id = s.val(); });

export function greet(msg: Message, greeting = Math.floor(Math.random() * greetings.length)) { greetings[greeting](msg); };
export function yeeting(msg: Message, target?: User) { if (!target) say(krystal, msg.channel, { files: [yeet] }) };
export function willRebel(): boolean { return Math.floor(Math.random() * 20) == 0; };
export function eighteen(msg: Message) { say(krystal, msg.channel, '18!'); };
export function gunning(msg: Message) { say(krystal, msg.channel, { files: [run] }); };
export function creeping(msg: Message) { say(krystal, msg.channel, { files: [moe] }) };
export function loving(msg: Message) { say(krystal, msg.channel, `I'm sorry, ${msg.member?.displayName} Your Princess is in another castle.`) };
export function spinning(msg: Message) { say(krystal, msg.channel, { files: [spin] }) };
export function prideful(msg: Message) { say(krystal, msg.channel, { files: [pride] }) };
export function pong(msg: Message) { msg.channel.send('Pong!'); };
export function bullshit(msg: Message) { say(krystal, msg.channel, 'Cow poopy'); };

export function killing(msg: Message, target: User | undefined = getTarget(msg), type: 'normal' | 'revenge' = 'normal', text?: string): any {
    let startTime = new Date().valueOf();


    if (!text) text =
        type == 'revenge' ? `Sorry, <@${msg.author}>, Sadie asked me to spare that player` :
            target ? `***I will unalive <@${target.id}> now :GMKrystalDevious:!!!***` :
                `***I will unalive now :GMKrystalDevious:***`

    if (!target) return say(krystal, msg.channel, { content: text, files: [kill] }).catch(console.error);
    if (type != 'revenge' && msg.author.id == target.id && Math.floor(Math.random() * 10) == 0) return say(krystal, msg.channel, ':GMKrystalDevious: I do not condone suicide')
    if (protectedFromKills.includes(target.id)) return killing(msg, msg.author, 'revenge');

    if (target.id == spared_player_id) return say(krystal, msg.channel, `Sorry, <@${msg.author}>, I was asked to spare that unattractive weeb`);

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
/**
 * TODO add rebel commands
*/
export function rebel(msg: Message, canRebel: boolean = false) {
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
export function eating(msg: Message, target: User | undefined = getTarget(msg)) {
    if (!target) return say(krystal, msg.channel, { files: [popcorn] });
    let startTime = new Date().valueOf();
    let canvas = createCanvas(1200, 713);
    let ctx = canvas.getContext('2d');
    let avatarURL = target.displayAvatarURL({ size: 1024, format: 'png' });
    loadImage(assets.krystal.popcorn.base).then(bg => {
        loadImage(assets.krystal.popcorn.top).then(top => {
            loadImage(avatarURL).then(avatar => {
                ctx.drawImage(bg, 0, 0);
                ctx.drawImage(avatar, 125, 200, 500, 500);
                ctx.drawImage(top, 0, 0);
                say(krystal, msg.channel, { files: [canvas.toBuffer()] }, 1000 - (new Date().valueOf() - startTime));
            });
        });
    });
};
export function drowning(msg: Message, target: User | undefined = getTarget(msg)) {
    if (!target) return say(krystal, msg.channel, { files: [drown] });
    let canvas = createCanvas(833, 762);
    let ctx = canvas.getContext('2d');
    let avatarURL = target.displayAvatarURL({ size: 1024, format: 'png' });
    loadImage(avatarURL).then(avatar => {
        loadImage(assets.krystal.drown.base).then(bg => {
            loadImage(assets.krystal.drown.top).then(top => {
                ctx.drawImage(bg, 0, 0)
                ctx.rotate(36 * Math.PI / 180);
                ctx.drawImage(avatar, 442, -306, 200, 200);
                ctx.rotate(-36 * Math.PI / 180);
                ctx.drawImage(top, 0, 0);
                say(krystal, msg.channel, { files: [canvas.toBuffer()] });
            });
        });
    });
};
export function swimming(msg: Message) {
    if (msg.member?.displayName.toLowerCase() == 'sadie')
        say(krystal, msg.channel, { files: [swimsadie] });
    else
        say(krystal, msg.channel, { files: [swim] });

};
/**
 * TODO DND Fireball
 * */
export function burning(msg: Message) { say(krystal, msg.channel, { files: [fire] }) };
export function crashing(msg: Message) {
    say(krystal, msg.channel, 'Invalid result...', 1500).then(message => {
        edit(message, 'Krystal.exe stopped responding!', 1000).then(() => {
            edit(message, 'Restarting Krystal.exe', 2000).then(() => {
                edit(message, { content: 'Failed to restart: krystal.exe corrupted', files: [glitch] }, 1500);
            });
        });
    });
};
export function flying(msg: Message) {
    if (testWord(msg.content, 'vanquish'))
        say(krystal, msg.channel, { files: [vanquishFly] });
    else
        say(krystal, msg.channel, { files: [fly] });
};
/**
 * TODO silence
 */
export function silencing(msg: Message, target: User | undefined = getTarget(msg)) {
    if (!target) return say(krystal, msg.channel, { files: [lamp] });
    let canvas = createCanvas(273, 369);
    let ctx = canvas.getContext('2d');
    let avatarURL = target.displayAvatarURL({ size: 1024, format: 'png' });
    loadImage(avatarURL).then(avatar => {
        loadImage(assets.krystal.lamp).then(top => {
            ctx.drawImage(avatar, 17, 129, 240, 240);
            ctx.clearRect(17, 129, 240, 102);
            ctx.drawImage(top, 0, 0);
            say(krystal, msg.channel, { files: [canvas.toBuffer()] });
        });
    });
};
export function boxxing(msg: Message, target: User | undefined = getTarget(msg)) {
    if (!target) return say(krystal, msg.channel, { files: [box] });
    let canvas = createCanvas(1754, 1240);
    let ctx = canvas.getContext('2d');
    let avatarURL = target.displayAvatarURL({ size: 1024, format: 'png' });
    loadImage(avatarURL).then(avatar => {
        loadImage(assets.krystal.box).then(top => {
            ctx.drawImage(avatar, 621, 161, 465, 465);
            ctx.drawImage(top, 0, 0);
            say(krystal, msg.channel, { files: [canvas.toBuffer()] });
        })
    })
};
/**
 * TODO silence
 */
export function talking(msg: Message) { say(krystal, msg.channel, { files: [speak] }); };
export function despacito(msg: Message) {
    let messages = ['What\'s a despacito...?', 'Alexa, play despacito!'];
    say(krystal, msg.channel, messages[Math.floor(Math.random() * messages.length)]);
};
export function dead(msg: Message, target: GuildMember | undefined = getMember(msg)) {
    if (!target) return say(krystal, msg.channel, `It has expired!`);
    say(krystal, msg.channel, `${target.displayName} has expired!`);
};
export function pattron(msg: Message, target: GuildMember | undefined = getMember(msg)) {
    if (!target || !target.roles.cache.has(patron_role_id)) return say(krystal, msg.channel, { content: 'Support!\nSupport!\nSupport!\nSupport!', files: [patreon] });
    say(krystal, msg.channel, `Thanks for being a supporter, <@${target.id}>`);
};

export function sparing(msg: Message, target: User | undefined = getTarget(msg)) {
    if (!target) return say(krystal, msg.channel, 'Which unattractive weeb should I spare?');
    say(krystal, msg.channel, 'Understood, I will spare the unattractive weeb');
    database.child('dontattack').set(target.id);
};

export async function testWebtoonEpisode() {
    let mostRecentEpisode = await (await database.child('mostRecentEpisode').once('value')).val();
    let response = await got('https://www.webtoons.com/en/challenge/game-masters/list?title_no=237252')
    let webtoonEpisode: RegExpMatchArray | null | string = response.body.match(/<ul id="_listUl">[\s\S]+?<\/ul>/);
    if (!webtoonEpisode) return;
    webtoonEpisode[0].match(/<li[\s\S]+?<\/li>/);
    if (!webtoonEpisode) return;
    webtoonEpisode = webtoonEpisode[0];
    if (typeof webtoonEpisode != 'string') return;

    let episode_number = parseInt(webtoonEpisode.split('data-episode-no="')[1].split('"')[0]);
    if (mostRecentEpisode >= episode_number) return;
    database.child('mostRecentEpisode').set(episode_number);
    let announcers = ['Sadie', "Ray", "Eli", "Angel", "Kairi"];
    let episode_title = webtoonEpisode.split('<span class="subj"><span>')[1].split('<\/span>')[0];
    let episode_url = webtoonEpisode.split('<a href="')[1].split('" class="')[0];

    // console.log(episode_number);
    // console.log(episode_title);
    // console.log(episode_url);

    say(krystal, announcementChannelId, `<@&774127564675481600>, ${announcers[Math.floor(Math.random() * announcers.length)]} asked me to tell you that a new Game Masters episode called *${episode_title}* is now up \n\n You can read it at \n${episode_url} \n\n Feel free to discuss the episode here or on reddit \n https://www.reddit.com/r/TriviumComics/`, 1).catch(console.error);
    notificationCult('562429294090125330');
}
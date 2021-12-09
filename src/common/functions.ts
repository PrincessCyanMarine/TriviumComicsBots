import { hyperlink } from "@discordjs/builders";
import { Canvas, CanvasRenderingContext2D, createCanvas } from "canvas";
import { ActivityType, Client, Guild, GuildMember, Message, MessageEmbed, MessageOptions, PresenceStatusData, TextBasedChannels, TextChannel, User } from "discord.js";
import GIFEncoder from "gifencoder";
import { Readable } from "stream";
import { database, testing } from "..";
import assets from "../assetsIndexes";
import { cerby, clients, CustomActivity, d20, eli, krystal, ray, sadie, sieg } from "../clients";
import { eli_activities } from "../eli/activities";
import { krystal_activities } from "../krystal/activities";
import { ray_activities } from "../ray/activities";
import { sadie_activities } from "../sadie/activities";
import emojis from "./emojis";
import { disturb_channels, ignore_channels, testChannelId } from "./variables";

export const argClean = (args: string): string => args.replace(/\,|\.|\?|\!|\;|\:|\{|\}|\[|\]|\"|\'/g, '');
const createRegex = (test: string[]): RegExp => new RegExp(`(?<![A-Z0-9])(${test.join('|')})(?![A-Z0-9])`, 'gi');

const argMatch = (args: string, test: string[]): RegExpMatchArray | null => argClean(args).match(createRegex(test));

export const testWord = (args: string, ...test: string[]): boolean => !!(argMatch(args, test));

export function testAllWords(args: string, ...test: string[]): boolean {
    let res = argMatch(args, test);
    return ((!!(res)) && (res.length == test.length));
}


export const say = (bot: Client, channel: TextBasedChannels | string, content: string | MessageOptions, delay = 1000): Promise<Message> =>
    new Promise((resolve, reject) => {
        delay = Math.max(1, delay);
        if (typeof content == 'string')
            content = detectEmoji(content);
        else if (content.content)
            content.content = detectEmoji(content.content);
        let id = typeof channel == 'string' ? channel : channel.id;
        bot.channels.fetch(id).then(c => {
            if (c instanceof TextChannel) {
                if (!bot.user) return;
                let member = c.members.get(bot.user.id);
                if (!member) return;
                if (!c.permissionsFor(member).has('SEND_MESSAGES')) return;

                c.sendTyping().then(() => {
                    setTimeout(() => {
                        c.send(content).then(resolve).catch(reject);
                    }, delay);
                }).catch(reject);
            }
        }).catch(reject);
    })

export function edit(msg: Message, content: string | MessageOptions, delay = 1000) {
    return new Promise((resolve, reject) => {
        delay = Math.max(1, delay);

        if (typeof content == 'string')
            content = detectEmoji(content);
        else if (content.content)
            content.content = detectEmoji(content.content);

        setTimeout(() => { msg.edit(content).then(resolve).catch(reject); }, delay);
    })
}

export function createEncoder(width: number, height: number, callback?: (buffer: Buffer) => void, options?: { delay?: number, repeat?: number, transparent?: number, quality?: number }): { encoder: GIFEncoder, stream: Readable, canvas: Canvas, ctx: CanvasRenderingContext2D } {
    let encoder = new GIFEncoder(width, height);
    if (!options) options = {};
    if (!options.repeat) options.repeat = 0;
    if (!options.delay) options.delay = 1;
    if (!options.quality) options.quality = 10;
    if (!options.transparent) options.transparent = 0;
    encoder.start();
    encoder.setRepeat(options.repeat);   // 0 for repeat, -1 for no-repeat
    encoder.setDelay(options.delay);  // frame delay in ms
    encoder.setQuality(options.quality); // image quality. 10 is default.
    encoder.setTransparent(options.transparent);
    let stream = encoder.createReadStream();
    let buf: Uint8Array[] = [];
    stream.on('data', function (d) { buf.push(d); });
    stream.on('end', function () {
        let buffer = Buffer.concat(buf);
        if (callback) callback(buffer);
        stream.destroy();
    })
    let canvas = createCanvas(width, height);
    let ctx = canvas.getContext('2d');
    return { encoder: encoder, stream: stream, canvas: createCanvas(width, height), ctx: canvas.getContext('2d') };
}

export function detectEmoji(content: string): string {
    // let text_emojis = content.match(/<:[^:]+:[0-9]+>/gi);
    let text_emojis = content.match(/:[^:]+:/gi);
    let changed: string[] = [];
    if (text_emojis) for (let emoji of text_emojis) {
        if (changed.includes(emoji)) continue;
        changed.push(emoji);
        if (emojis[emoji]) {
            let regexp = new RegExp(emoji, 'gi');
            content = content.replace(regexp, emojis[emoji]);
        }
    }
    return content;
}

export function getTarget(msg: Message): User | undefined {
    if (msg.mentions.users.first()) return msg.mentions.users.first();
    if (testWord(msg.content, "me", "I", "Im", "my")) return msg.author;
    return undefined;
}

export function getMember(msg: Message): GuildMember | undefined {
    if (msg.mentions.members?.first()) return msg.mentions.members.first();
    if (msg.member && testWord(msg.content, "me", "I", "Im")) return msg.member;
    return undefined;
}

export function notificationCult(channel_id: string) {
    [krystal, sadie, ray, eli].forEach(bot => { say(bot, channel_id, ':GMBelleNotificationNew:').catch(console.error); });
}

export function changeActivity(bot_name: string, type: Exclude<ActivityType, "CUSTOM">, text: string, avatar?: string | Buffer, name: string = text, nickname: string | null = null) {
    let bot = clients[bot_name];
    // let status: "dnd" | "online" = random_from_array(["online", "online", "online", "dnd"]);
    // let status: "online" = "online";
    bot.user?.setPresence({ activities: [{ type: type, name: name }] });
    if (avatar) bot.user?.setAvatar(avatar).catch(() => { console.error(`Couldn\'t change ${bot.user?.username}\'s avatar'`) });
    bot.guilds.cache.forEach(guild => {
        if (nickname)
            guild.me?.setNickname(nickname)
    });
    // console.log(bot.user?.username + ': ' + bot.user?.presence.status);
    database.child('activities/' + bot.user?.username).set(name);
};

export const msg2embed = (msg: Message) => {
    let embed = new MessageEmbed()
        .setAuthor(msg.author.username, msg.author.displayAvatarURL(), msg.url)
        .setTitle("Go to original")
        .setURL(msg.url)
        .setDescription(msg.content)
        .setTimestamp(msg.createdTimestamp)
        .setColor(msg.member?.displayHexColor || "WHITE")
    let img = msg.attachments.first()?.url;
    if (img) embed.setImage(img);
    let embeds = msg.embeds;
    embeds.unshift(embed);
    return embeds;
}

export const random_from_array = <Item>(array: Item[]): Item => array[Math.floor(Math.random() * array.length)];
export const capitalize = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1);
export const randomchance = (percentage: number = 10): boolean => Math.floor(Math.random() * 100) < percentage;


export function changeActivities() {
    if (testing) return;
    if (!(ray.isReady() && krystal.isReady() && sadie.isReady() && eli.isReady() && cerby.isReady() && sieg.isReady() && d20.isReady())) return;
    sieg.user?.setStatus('invisible');

    let test_padoru = () => {
        let padoru_chance: number;
        if (new Date().getMonth() == 10) padoru_chance = 50;
        else if (new Date().getMonth() == 11) padoru_chance = 85;
        else return false;
        if (randomchance(padoru_chance))
            return true;
        else
            return false;
    }

    let change_to_padoru = (a: CustomActivity[]) => {
        let bot: string;
        let avatar: string;
        let nickname: string;

        switch (a) {
            case eli_activities:
                bot = "eli";
                avatar = assets.eli.avatars.padoru;
                nickname = "Padoru Eli";
                break;
            case krystal_activities:
                bot = "krystal";
                avatar = assets.krystal.avatars.padoru;
                nickname = "Padoru Krystal";
                break;
            case ray_activities:
                bot = "ray";
                avatar = assets.ray.avatars.padoru;
                nickname = "Padoru Ray";
                break;
            case sadie_activities:
                bot = "sadie";
                avatar = assets.sadie.avatars.padoru;
                nickname = "Padoru Sadie";
                break;
            default:
                return;
                break;
        }

        changeActivity(bot, "LISTENING", "padoru", avatar, undefined, nickname);
    }

    [eli_activities, ray_activities, sadie_activities, krystal_activities].forEach(a => {
        let ac: CustomActivity = random_from_array(a);
        if (test_padoru()) { change_to_padoru(a); return; };
        changeActivity(...random_from_array(a));
    });

    setTimeout(changeActivities, (1000 * 60 * 30));
}

export function ignore_message(msg: Message, bot: Client): boolean {
    if (!msg || !msg.member || !msg.author || msg.author.bot) return true;
    if (msg.content.startsWith('!')) return true;
    if (ignore_channels.includes(msg.channel.id)) return true;
    if (testing) {
        if (msg.channelId != testChannelId) return true;
    } else
        if (msg.channelId == testChannelId) return true;
    // if ((!(disturb_channels.includes(msg.channel.id))) && bot.user?.presence.status == 'dnd') return true;
    return false;
}
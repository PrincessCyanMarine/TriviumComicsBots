import { Canvas, CanvasRenderingContext2D, createCanvas } from "canvas";
import { Client, GuildMember, Message, MessageOptions, TextBasedChannels, TextChannel, User } from "discord.js";
import GIFEncoder from "gifencoder";
import { Readable } from "stream";
import { eli, krystal, ray, sadie } from "../clients";
import emojis from "./emojis";

const argClean = (args: string): string => args.replace(/\,|\.|\?|\!|\;|\:|\{|\}|\[|\]|\"|\'/g, '');
const createRegex = (test: string[]): RegExp => new RegExp(`(?<![A-Z0-9])(${test.join('(?![A-Z0-9])|(?<![A-Z0-9])')}(?![A-Z0-9]))`, 'gi');

const argMatch = (args: string, test: string[]): RegExpMatchArray | null => argClean(args).match(createRegex(test));

export const testWord = (args: string, ...test: string[]): boolean => !!(argMatch(args, test));

export function testAllWords(args: string, ...test: string[]): boolean {
    let res = argMatch(args, test);
    return ((!!(res)) && (res.length == test.length));
}


export function say(bot: Client, channel: TextBasedChannels | string, content: string | MessageOptions, delay = 1000): Promise<Message> {
    return new Promise((resolve, reject) => {
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
};

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


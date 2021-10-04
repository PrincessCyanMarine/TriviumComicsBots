import { Canvas, CanvasRenderingContext2D, createCanvas } from "canvas";
import { Client, Message, MessageOptions, TextBasedChannels, TextChannel, User } from "discord.js";
import GIFEncoder from "gifencoder";
import { Readable } from "stream";
import emojis from "./emojis";

export function testWord(args: string, ...test: string[]): boolean {
    return !!(args.replace(/\,|\.|\?|\!|\;|\:|\{|\}|\[|\]|\"|\'/g, '').match(createRegex(test)));
}

export function testAllWords(args: string, ...test: string[]): boolean {
    args = args.replace(/\,|\.|\?|\!|\;|\:|\{|\}|\[|\]|\"|\'/g, '');
    let res = args.match(createRegex(test));
    return ((!!(res)) && (res.length == test.length));
}

function createRegex(test: string[]): RegExp {
    return new RegExp(`(${test.join('(?![A-Z0-9])|')}(?![A-Z0-9]))`, 'gi');
}

export function say(bot: Client, channel: TextBasedChannels, content: string | MessageOptions, delay = 1000): Promise<Message> {
    return new Promise((resolve, reject) => {
        console.log(`Pre min ${delay}`);
        delay = Math.min(1, delay);
        console.log(`Post min ${delay}`);
        if (typeof content == 'string') content = detectEmoji(content);
        else if (content.content) content.content = detectEmoji(content.content);
        bot.channels.fetch(channel.id).then(c => {
            if (c instanceof TextChannel) {
                c.sendTyping().then(() => {
                    setTimeout(() => {
                        c.send(content).then(resolve).catch(reject);
                    }, delay);
                }).catch(reject);
            }
        }).catch(reject);
    })
};

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
        let regexp = new RegExp(emoji, 'gi');
        emoji = emoji.split(':')[1];
        if (emojis[emoji]) content = content.replace(regexp, emojis[emoji]);
    }
    return content;
}

export function getTarget(msg: Message): User | undefined {
    if (msg.mentions.users.first()) return msg.mentions.users.first();
    if (testWord(msg.content, "me")) return msg.author;
    return undefined;
}
import axios from "axios";
import { Client, Message, MessageOptions, TextBasedChannels, TextChannel } from "discord.js";
import GIFEncoder from "gifencoder";
import { Readable } from "stream";

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

export async function getImageFromURL(avatarURL: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        axios({ url: avatarURL, responseType: 'arraybuffer' }).then((imageResponse) => {
            resolve(Buffer.from(imageResponse.data, 'binary'));
        }).catch(reject);
    });
}

export function createEncoder(width: number, height: number, delay: number = 1, repeat: number = 0, transparent: number = 0, quality: number = 10): { encoder: GIFEncoder, stream: Readable } {
    let encoder = new GIFEncoder(width, height);
    encoder.start();
    encoder.setRepeat(repeat);   // 0 for repeat, -1 for no-repeat
    encoder.setDelay(delay);  // frame delay in ms
    encoder.setQuality(quality); // image quality. 10 is default.
    encoder.setTransparent(transparent);
    return { encoder: encoder, stream: encoder.createReadStream() };
}
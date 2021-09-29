import axios from "axios";
import { Client, Message, MessageOptions, TextBasedChannels, TextChannel } from "discord.js";

export function testWord(args: string[] | string, ...test: string[]): boolean {
    let i: number;
    let e: number;
    if (typeof args == 'string') args = getArgs(args);
    for (e = 0; e <= args.length; e++)
        if (e == args.length) return false;
        else for (i = 0; i < test.length; i++)
            if (test[i] == args[e]) return true;
    return false
};

export function testAllWords(args: string[] | string, ...test: string[]): boolean {
    let i: number;
    let e: number;
    let matches = 0;
    if (typeof args == 'string') args = getArgs(args);
    for (e = 0; e <= args.length; e++)
        if (e == args.length) {
            if (matches == test.length) return true;
            return false;
        }
        else for (i = 0; i < test.length; i++) {
            if (test[i] == args[e]) {
                matches++;
                break;
            }
        }
    return false
};

export function say(bot: Client, channel: TextBasedChannels, content: string | MessageOptions, delay = 1000): Promise<Message> {
    return new Promise((resolve, reject) => {
        bot.channels.fetch(channel.id).then(c => {
            if (c instanceof TextChannel) {
                c.sendTyping().then(() => {
                    setTimeout(() => {
                        c.send(content).then(resolve).catch(reject);
                    }, delay);
                }).catch(console.error);
            }
        }).catch(console.error);
    })
};

export function getArgs(content: string): string[] {
    return content.toLowerCase().replace(/\,|\.|\?|\!|\;|\:|\{|\}|\[|\]|\"|\'/g, '').split(' ');
}

export async function getImageFromURL(avatarURL: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        axios({ url: avatarURL, responseType: 'arraybuffer' }).then((imageResponse) => {
            resolve(Buffer.from(imageResponse.data, 'binary'));
        }).catch(reject);
    });
}
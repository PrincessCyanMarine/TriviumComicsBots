import { Message } from "discord.js";
import { testAllWords, testWord } from "../common/functions";
import { killWords } from "../common/variables";
import { bestwaifu, dm, greet, kicking, punching, tsundere, weeb } from "./functions";

export function testCommands(msg: Message) {
    let args = msg.content;
    if (testWord(args, "sadie")) {
        msg.channel.sendTyping();
        if (testWord(args, "waifu") || testAllWords(args, "best", "girl") || testAllWords(args, "worst", "girl")) bestwaifu(msg);
        else if (testWord(args, "weeb")) weeb(msg);
        else if (testWord(args, ...killWords)) punching(msg);
        else if (testWord(args, 'dm')) dm(msg);
        else if (testWord(args, 'kick')) kicking(msg);
        else if (testWord(args, 'like.?', 'love.?')) tsundere(msg);
        else greet(msg);
    }
}
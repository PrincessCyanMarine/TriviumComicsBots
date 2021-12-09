import { Message } from "discord.js";
import { say, testAllWords, testWord } from "../common/functions";
import { killWords } from "../common/variables";
import { beating } from "./functions";

export function testCommands(msg: Message) {
    let args = msg.content;

    if (testWord(args, "ray"))
        if (testWord(args, ...killWords)) return beating(msg);
}
import { Message } from "discord.js";
import { eli, ray, sadie } from "../clients";
import { randomchance, say, testAllWords, testWord } from "../common/functions";
import { killWords } from "../common/variables";
import { beating } from "./functions";

export function testCommands(msg: Message) {
    let args = msg.content;

    if (testWord(args, "69"))
        if (randomchance(5)) say(sadie, msg.channel, "That joke is dumb");
        else say(randomchance(80) ? ray : eli, msg.channel, "Nice");
    else if (testWord(args, "ray")) if (testWord(args, ...killWords)) return beating(msg);
}

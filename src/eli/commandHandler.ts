import { Message } from "discord.js";
import { eli, ray, sadie } from "../clients";
import { randomchance, say, testAllWords, testWord } from "../common/functions";
import { calculate, dodoOnline } from "./functions";

export function testCommands(msg: Message) {
    let args = msg.content;
    // let math_exp = args.match(/([0-9]+)(?:\s*([*/+-])\s*([0-9]+))+/g);

    if (testAllWords(args, "dodo|dodad", "online|home")) dodoOnline(msg);
    else if (testWord(args, "420"))
        if (randomchance(5)) say(sadie, msg.channel, "That joke is dumb", undefined, { messageReference: msg });
        else say(randomchance(80) ? eli : ray, msg.channel, "Look dad it's the good cush", undefined, { messageReference: msg });

    //else if (math_exp) calculate(math_exp);
}

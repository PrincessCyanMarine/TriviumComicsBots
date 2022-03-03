import { Message } from "discord.js";
import { say, testAllWords, testWord } from "../common/functions";
import { calculate, dodoOnline } from "./functions";

export function testCommands(msg: Message) {
  let args = msg.content;
  let math_exp = args.match(/([0-9]+)(?:\s*([*/+-])\s*([0-9]+))+/g);

  if (testAllWords(args, "dodo|dodad", "online|home")) dodoOnline(msg);
  //else if (math_exp) calculate(math_exp);
}

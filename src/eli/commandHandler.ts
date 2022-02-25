import { Message } from "discord.js";
import { say, testAllWords, testWord } from "../common/functions";
import { dodoOnline } from "./functions";

export function testCommands(msg: Message) {
  let args = msg.content;

  if (testAllWords(args, "dodo|dodad", "online|home")) dodoOnline(msg);
}

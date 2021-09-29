import { Message } from "discord.js";
import { testWord } from "../common/functions";

export function testCommands(msg: Message) {
    if (testWord(msg.content, "sadie")) msg.channel.send("Hey there!");
}
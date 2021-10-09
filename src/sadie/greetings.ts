import { Message } from "discord.js";
import { sadie } from "../clients";
import { say } from "../common/functions";

export const greetings = [
    (msg: Message) => { say(sadie, msg.channel, 'Sup'); },
    (msg: Message) => { say(sadie, msg.channel, 'Yo, weeb'); },
    (msg: Message) => { say(sadie, msg.channel, 'If you\'re gonna ask me to DM, that\'s a "no". \nI already got a group of idiots to DM.'); },
];
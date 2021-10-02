import { Message } from "discord.js";
import { d20, database } from "../clients";
import { say } from "../common/functions";
import { not_count_in_channel_ids } from "../common/variables";

export async function countMessages(msg: Message) {
    if (not_count_in_channel_ids.includes(msg.channel.id)) return;
    let messages = await (await database.child(`lvl/${msg.author.id}`).once('value')).val();
    messages++;
    database.child(`lvl/${msg.author.id}`).set(messages);
}
import { Message } from "discord.js";
import { database } from "..";
import { not_count_in_channel_ids } from "../common/variables";

export async function countMessages(msg: Message) {
    if (not_count_in_channel_ids.includes(msg.channel.id)) return;
    let messages = await (await database.child(`test_lvl/${msg.author.id}`).once('value')).val();
    messages++;
    database.child(`test_lvl/${msg.author.id}`).set(messages);
}
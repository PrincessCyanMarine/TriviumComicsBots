import { Message } from "discord.js";
import { database } from "..";
import { not_count_in_channel_ids, testGuildId, triviumGuildId } from "../common/variables";

export async function countMessages(msg: Message) {
    if (!msg.guildId || ![triviumGuildId, testGuildId].includes(msg.guildId)) return;
    if (not_count_in_channel_ids.includes(msg.channel.id)) return;
    let database_lvl_path = msg.guildId == triviumGuildId ? `lvl/${msg.author.id}` : `test_lvl/${msg.author.id}`;
    let messages = await (await database.child(database_lvl_path).once('value')).val();
    messages++;
    database.child(database_lvl_path).set(messages);
}
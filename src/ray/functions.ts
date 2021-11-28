import { Message, MessageOptions } from "discord.js";
import { database, testing } from "..";
import { clients, id2bot, ray } from "../clients";
import { say } from "../common/functions";

const roleplay_channels = () => {
    if (testing) return {
        input: '909151745605791804',
        output: '909152121037926420'
    }; else return {
        input: '726171325856743525',
        output: '562431692703531018'
    };

}
export async function roleplay(msg: Message) {
    if (!msg || !msg.member || !msg.author || msg.author.bot) return;
    let rc = roleplay_channels();
    if (msg.channel.id != rc.input) return;
    let bot = await (await database.child('roleplay/' + msg.author.id).once('value')).val();
    if (!bot) { say(ray, msg.channel, 'You need to select a character to roleplay as'); return; };
    let message: MessageOptions = {};
    if (msg.content) message.content = msg.content;
    if (msg.attachments) message.files = msg.attachments.map(a => a);
    say(clients[id2bot[bot]], rc.output, message).catch(console.error);
}
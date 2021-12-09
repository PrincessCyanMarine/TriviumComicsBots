import { createCanvas, loadImage } from "canvas";
import { GuildMember, Message, MessageOptions, User } from "discord.js";
import { database, testing } from "..";
import assets from "../assetsIndexes";
import { beat } from "../attachments";
import { clients, id2bot, ray } from "../clients";
import { getTarget, say } from "../common/functions";

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

export async function beating(msg: Message, target: User | GuildMember | undefined = getTarget(msg)) {
    return new Promise((resolve, reject) => {
        if (msg) msg.channel.sendTyping();
        let start_time = new Date().valueOf();
        if (target instanceof GuildMember) target = target.user;
        if (!target)
            if (msg)
                return say(ray, msg.channel, { files: [beat] })
            else
                return resolve(beat);

        let width = 1000, height = 708
        let canvas = createCanvas(width, height);
        let ctx = canvas.getContext('2d');
        let avatarURL = target.displayAvatarURL({ size: 1024, format: 'png' });
        loadImage(avatarURL).then(avatar => {
            loadImage(assets.ray.beat).then(top => {
                ctx.drawImage(avatar, 530, 144, 419, 419);
                ctx.drawImage(top, 0, 0);
                if (msg)
                    say(ray, msg.channel, { files: [canvas.toBuffer()] }, new Date().valueOf() - start_time);
                else
                    resolve(canvas.toBuffer());
            })
        })
    })

}
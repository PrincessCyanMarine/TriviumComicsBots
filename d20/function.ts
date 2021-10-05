import { Canvas, createCanvas, loadImage, registerFont } from "canvas";
import { Message } from "discord.js";
import { createWriteStream } from "fs";
import { database } from "..";
import assets from "../assetsIndexes";
import { not_count_in_channel_ids, testGuildId, triviumGuildId } from "../common/variables";

registerFont(assets.d20.card.font, { family: 'LETTERER' });

export async function countMessages(msg: Message) {
    if (!msg.guildId || ![triviumGuildId, testGuildId].includes(msg.guildId)) return;
    if (not_count_in_channel_ids.includes(msg.channel.id)) return;
    let database_lvl_path = msg.guildId == triviumGuildId ? `lvl/${msg.author.id}` : `test_lvl/${msg.author.id}`;
    let messages = await (await database.child(database_lvl_path).once('value')).val();
    messages++;
    database.child(database_lvl_path).set(messages);
}

function createXpBar(style: string, color: string) {
    return new Promise(async (resolve, reject) => {
        let [width, height] = [664, 29];
        let canvas = createCanvas(width, height);
        let ctx = canvas.getContext('2d');
        let xp_bar = await loadImage('./assets/d20/card/xpbar/' + style + '.png');
        ctx.drawImage(xp_bar, 0, 0);
        ctx.globalCompositeOperation = "color";
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = "destination-out";
        ctx.drawImage(await loadImage('./assets/d20/card/xpbar/blank.png'), 0, 0);
        resolve(canvas);
    })
}

export function createCard(username: string, level: number, messages: number, title: string, guild: string, prestige: number, position: number, time_on_server: number, warnings: number, message_to_levelup: number): Promise<Canvas> {
    return new Promise(async (resolve, reject) => {
        let canvas = createCanvas(1000, 750);
        let ctx = canvas.getContext('2d');
        ctx.font = '32px "LETTERER"';
        ctx.fillStyle = '#212121';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFDF00';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 5;
        ctx.shadowOffsetX = 5;
        ctx.drawImage(await createXpBar('stripesb', '#00FFFF'), 0, 0);
        resolve(canvas);
    });
}

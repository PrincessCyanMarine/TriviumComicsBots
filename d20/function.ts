import { Canvas, createCanvas, Image, loadImage, NodeCanvasRenderingContext2D, registerFont } from "canvas";
import { GuildMember, Message } from "discord.js";
import { createWriteStream } from "fs";
import { database } from "..";
import assets from "../assetsIndexes";
import { not_count_in_channel_ids, testGuildId, triviumGuildId } from "../common/variables";

registerFont(assets.d20.card.font, { family: 'LETTERER' });

export async function countMessages(msg: Message) {
    if (!msg.guildId || !msg.member) return;
    if (msg.content.startsWith('!') || msg.attachments.first()) return;
    if (not_count_in_channel_ids.includes(msg.channelId)) return;
    let database_path = `/${msg.guildId}/${msg.author.id}`;
    let messages = await (await database.child('lvl' + database_path).once('value')).val();
    if (!messages) messages = 0;
    messages++;
    database.child('lvl' + database_path).set(messages);

    let level_saved = await (await database.child('level' + database_path).once('value')).val();
    if (!level_saved || typeof level_saved != 'number') database.child('level' + database_path).set(1);
    else {
        let prestige = await (await database.child('prestige' + database_path).once('value')).val();
        let current_level = getLevel(messages, prestige);
        if (current_level > level_saved) msg.channel.send(`${msg.member.displayName} went from level ${level_saved} to level ${current_level}`);
        database.child('level' + database_path).set(current_level);
    }
    let guild = await (await database.child('guild/' + msg.member.id + '/1').once('value')).val();
    if (!guild || typeof guild != 'number') return;
    guild++;
    database.child('guild/' + msg.member.id + '/1').set(guild);
}

export function createXpBar(style: string, color_a: string, color_b: string = '#000000'): Promise<Canvas> {
    return new Promise(async (resolve, reject) => {
        let [width, height] = [664, 29];
        let paint = (bar: Image, color: string) => {
            let canvas = createCanvas(width, height);
            let ctx = canvas.getContext('2d');

            ctx.drawImage(bar, 0, 0);
            ctx.globalCompositeOperation = "color";
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, width, height);

            return canvas;
        }
        let send = async (canvas: Canvas) => {
            let ctx = canvas.getContext('2d');
            ctx.globalCompositeOperation = "destination-out";
            ctx.drawImage(await loadImage('./assets/d20/card/xpbar/blank.png'), 0, 0);
            resolve(canvas);
        }

        let xp_bar = await loadImage('./assets/d20/card/xpbar/' + style + '.png');
        let canvas = paint(xp_bar, color_a);
        let ctx = canvas.getContext('2d');

        if (style.includes('dual')) {
            let xp_bar2 = await loadImage('./assets/d20/card/xpbar/' + style + '2.png');
            ctx.globalCompositeOperation = "destination-out";
            ctx.drawImage(xp_bar2, 0, 0);

            let canvas2 = paint(xp_bar2, color_b);
            let ctx2 = canvas2.getContext('2d');

            ctx2.globalCompositeOperation = "destination-out";
            ctx2.drawImage(xp_bar, 0, 0);

            ctx.globalCompositeOperation = "source-over";
            ctx.drawImage(canvas2, 0, 0);
            send(canvas)
        } else send(canvas);
    });
}

type StatsObject = {
    sleep: number
    lamp: number
    box: number
    kill: number
    popcorn: number
    spare: number
    yeet: number
    punch: number
    kick: number
}
type CardOptions = {
    username: string
    level: number
    messages: number
    title?: string
    guild?: string
    prestige?: number
    position: number
    time_on_server: number
    warnings: number
    message_to_levelup: number
    nextlevel_min_messages: number
    percentage: number
    avatar_url: string
    xp_bar: {
        style: string,
        color_a: string,
        color_b?: string
    },
    stats: StatsObject,
    target: GuildMember
}

const gold_font_color = '#FFDF00';
const silver_font_color = '#C0C0C0';
const bronze_font_color = '#CD7F32';
const podium_fonts = [gold_font_color, silver_font_color, bronze_font_color];

export function createCard(cardoptions: CardOptions): Promise<Canvas> {
    return new Promise(async (resolve, reject) => {
        let canvas = createCanvas(1000, 750);
        let ctx = canvas.getContext('2d');
        ctx.font = '32px "LETTERER", cursive, sans-serif, serif, Verdana, Arial, Helvetica';
        // ctx.fillStyle = '#212121';
        // ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(await loadImage('./assets/d20/card/background.png'), 0, 0);

        ctx.shadowColor = '#111111';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 10;
        ctx.shadowOffsetX = 10;

        ctx.drawImage(await loadImage('./assets/d20/card/xpbar/bg.png'), 16, 19);
        let xp_bar = await createXpBar(cardoptions.xp_bar.style, cardoptions.xp_bar.color_a, cardoptions.xp_bar.color_b);
        ctx.shadowColor = '#00000000';
        ctx.drawImage(xp_bar, 0, 0, xp_bar.width * cardoptions.percentage, xp_bar.height, 22, 25, xp_bar.width * cardoptions.percentage, xp_bar.height);
        ctx.shadowColor = '#111111';

        let avatar = await loadImage(cardoptions.avatar_url);
        ctx.drawImage(avatar, 15, 309, 415, 415);

        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 1;
        ctx.shadowOffsetY = 6;
        ctx.shadowOffsetX = 6;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(cardoptions.username, 15, 301);
        ctx.fillText(`Level: ${cardoptions.level}`, 800, 49);
        ctx.fillText(`${cardoptions.messages} messages sent`, 40, 140);
        ctx.fillText(cardoptions.stats['sleep'].toString(), 521, 384 + 24);
        ctx.fillText(cardoptions.stats['lamp'].toString(), 521, 417 + 24);
        ctx.fillText(cardoptions.stats['box'].toString(), 521, 457 + 24);
        ctx.fillText(cardoptions.stats['kill'].toString(), 521, 491 + 24);
        ctx.fillText(cardoptions.stats['popcorn'].toString(), 521, 524 + 24);
        ctx.fillText(cardoptions.stats['spare'].toString(), 521, 558 + 24);
        ctx.fillText(cardoptions.stats['yeet'].toString(), 521, 594 + 24);
        ctx.fillText(cardoptions.stats['punch'].toString(), 521, 632 + 24);
        ctx.fillText(cardoptions.stats['kick'].toString(), 521, 668 + 24);


        if (!cardoptions.prestige) cardoptions.prestige = 0;
        if (cardoptions.level < (15 + (cardoptions.prestige * 5))) {
            ctx.fillText(`${cardoptions.message_to_levelup} left`, 40, 104);
            ctx.fillText(`${cardoptions.nextlevel_min_messages}`, 650, 104);
            ctx.fillText(`${Math.floor(cardoptions.percentage * 100)}%`, 710, 49);
        } else {
            ctx.fillText(`MAX LEVEL`, 40, 104);
            ctx.fillText(`MAX LEVEL`, 650, 104);
            ctx.fillText(`100%`, 710, 49);
        }

        if (cardoptions.title) ctx.fillText(cardoptions.title, 15, 259);


        let badge_positions = [665, 601, 537, 473]
        let badges = [];
        let badge_patreon = await loadImage('./assets/d20/card/patreon.png');
        let badge_booster = await loadImage('./assets/d20/card/booster.png');
        let badge_trivium = await loadImage('./assets/d20/card/triviumLogo.png');
        if (cardoptions.target.roles.cache.has('579230527140134923') || cardoptions.target.roles.cache.has('609593848448155668') || cardoptions.target.roles.cache.has('579231612924067840')) badges.push(badge_trivium);
        if (cardoptions.target.roles.cache.has('715775653991153726')) badges.push(badge_booster);
        if (cardoptions.target.roles.cache.has('795925053689692200') || cardoptions.target.roles.cache.has('795922644016824360') || cardoptions.target.roles.cache.has('795921622862659585') || cardoptions.target.roles.cache.has('795920588463800320')) badges.push(badge_patreon);
        for (let b in badges) ctx.drawImage(badges[b], 630, badge_positions[b]);

        if (cardoptions.target.user.bot) ctx.drawImage(await loadImage('./assets/d20/card/bot.png'), 906, 605);

        if (cardoptions.title) ctx.fillText(cardoptions.title, 15, 235 + 24);
        if (cardoptions.guild) ctx.fillText(cardoptions.guild, 800, 73 + 24);

        ctx.fillText(`${cardoptions.time_on_server.toString()} months`, 521, 340 + 24);
        ctx.fillText(`${cardoptions.warnings.toString()} warning(s)`, 40, 159 + 24);

        let position_change = cardoptions.position < 10 ? 0 : cardoptions.position < 100 ? 16 : 32;
        ctx.fillStyle = cardoptions.position <= 3 ? podium_fonts[cardoptions.position - 1] : "#FFFFFF"
        ctx.fillText(`#${cardoptions.position}`, 900 - position_change, 704);

        ctx.fillStyle = gold_font_color;
        if (cardoptions.prestige > 0) ctx.fillText(`Prestige ${cardoptions.prestige}`, 700, 680 + 24);

        resolve(canvas);
    });
}

export function getposition(guildid: string, memberid: string): Promise<number> {
    return new Promise((resolve, reject) => {
        database.child('lvl/' + guildid).once('value').then(a => {
            let messages = a.val()[memberid];
            let ranking: number[] = Object.values(a.val());
            ranking.sort((a, b) => b - a);
            for (let i = 0; i < ranking.length; i++)
                if (messages == ranking[i])
                    resolve(i + 1);
        });
    });
}


const lvl_base = 18;
const xp_cost_increase = 22;
export const getLevelCost = (level: number): number => (level - 1) * (lvl_base + (xp_cost_increase / 2 * (level - 2)));
export const accountForPrestige = (messages = 0, prestige = 0) => { for (let p = 1; p <= prestige; p++) messages -= getLevelCost((15 + (5 * (p - 1)))); return messages };
export function getLevel(messages = 0, prestige = 0) {
    messages = accountForPrestige(messages, prestige);
    for (let l = 0; l < 15 + (5 * (prestige + 1)); l++) if (messages < getLevelCost(l)) return Math.max(1, l - 1);
    return 15 + (5 * (prestige));
}
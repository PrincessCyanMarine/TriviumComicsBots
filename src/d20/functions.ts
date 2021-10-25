import { userMention } from "@discordjs/builders";
import { Canvas, createCanvas, Image, loadImage, registerFont } from "canvas";
import { CommandInteraction, ContextMenuInteraction, DiscordAPIError, GuildMember, Interaction, Message, PermissionResolvable, User, TextBasedChannels, Role } from "discord.js";
import { database } from "..";
import assets from "../assetsIndexes";
import { d20 } from "../clients";
import { say } from "../common/functions";
import { not_count_in_channel_ids, testGuildId, triviumGuildId } from "../common/variables";
import { reply } from "../interactions/slash/common";

registerFont(assets.d20.card.fonts.letterer, { family: 'LETTERER' });
registerFont(assets.d20.card.fonts.kosugiMaru, { family: 'KOSUGIMARU' });
registerFont(assets.d20.card.fonts.opensans, { family: 'OPENSANS' });
registerFont(assets.d20.card.fonts.notosans, { family: 'NOTOSANS' });

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
    let guild = await (await database.child('guild/' + msg.member.id).once('value')).val();
    if (!guild || typeof guild != 'string') return;
    let guild_messages = await (await database.child('guilds/' + msg.guildId + '/' + guild).once('value')).val();
    if (!guild_messages || typeof guild_messages != 'number') guild_messages = 0;
    guild_messages++;
    database.child('guilds/' + msg.guildId + '/' + guild).set(guild_messages);
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

export type StatsObject = {
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
export type CardOptions = {
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
        // console.log(cardoptions);
        let canvas = createCanvas(1000, 750);
        let ctx = canvas.getContext('2d');
        ctx.font = '32px "LETTERER", "KOSUGIMARU", "OPENSANS", "NOTOSANS"';
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
        if (cardoptions.percentage < 0) cardoptions.percentage = cardoptions.percentage * -1;
        cardoptions.percentage = Math.max(Math.min(cardoptions.percentage, 1), 0);
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

export function getposition(guildid: string, memberid: string, all_messages?: { [id: string]: number; }): Promise<number> {
    return new Promise(async (resolve, reject) => {
        if (!all_messages) all_messages = await (await database.child('lvl/' + guildid).once('value')).val();
        if (!all_messages) return resolve(1);
        let messages = all_messages[memberid];
        let ranking: number[] = Object.values(all_messages);
        if (!messages) return resolve(ranking.length);
        ranking.sort((a, b) => b - a);
        for (let i = 0; i < ranking.length; i++)
            if (messages == ranking[i])
                resolve(i + 1);
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

export async function prestige(msg: Message | CommandInteraction) {
    if (!msg.guild) return;
    let guildId = msg.guildId;
    let authorId;
    let displayName;
    if (msg instanceof Message) {
        authorId = msg.author.id;
        displayName = msg.member?.displayName;
    } else {
        authorId = msg.user.id;
        displayName = msg.user.username;
    }
    let level = await (await database.child('level/' + guildId + '/' + authorId).once('value')).val();
    let prestige = await (await database.child('prestige/' + guildId + '/' + authorId).once('value')).val();
    if (!level) level = 1;
    if (!prestige) prestige = 0;
    let min_prestige = 15 + (5 * prestige);

    let maxed = `You already maxed out on prestige!!!\nCongratulations!`;
    let fail = `You will be able to prestige at level ${min_prestige}\nCurrent level: ${level}`;
    let success = `${displayName} prestiged!`;

    if (prestige >= 5) {
        if (msg instanceof Message)
            say(d20, msg.channel, maxed);
        else
            reply(msg, maxed, false);
        return;
    };

    if (level >= min_prestige) {
        prestige++;
        level = 1;
        database.child('level/' + guildId + '/' + authorId).set(level);
        database.child('prestige/' + guildId + '/' + authorId).set(prestige);
        if (msg instanceof Message)
            say(d20, msg.channel, success);
        else
            reply(msg, success);
    } else
        if (msg instanceof Message)
            say(d20, msg.channel, fail);
        else
            reply(msg, fail);
}

export async function bankick(interaction: CommandInteraction, type: 'ban' | 'kick') {
    let target = interaction.options.get('player')?.member;
    let reason = interaction.options.get('reason')?.value;
    let days = interaction.options.get('days')?.value;

    if (!target || !interaction.guild || !(target instanceof GuildMember)) { reply(interaction, 'Something went wrong'); return; };
    if (!reason || typeof reason != 'string') reason = '';
    if (!days || typeof days != 'number') days = 0;
    days = Math.min(7, Math.max(0, days));

    let author = await interaction.guild.members.fetch(interaction.user.id);
    let perm: PermissionResolvable = type == 'ban' ? "BAN_MEMBERS" : "KICK_MEMBERS";
    if (!author.permissions.has(perm)) { reply(interaction, 'You don\' have permission to do that...', true); return; };
    let target_name = target.displayName;

    let fun = type == 'ban' ? target.ban({ reason: reason, days: days }) : target.kick(reason);
    fun
        .then(() => {
            reply(
                interaction,
                `Successfully ${type == 'ban' ? 'banned' : 'kicked'} ${target_name}!${type == 'ban' ? `\nDuration: ${days == 0 ? 'forever' : `${days} days`}` : ''}${reason != '' ? `\nBecause \"${reason}\"` : ''}`
            );
        })
        .catch((er) => {
            if (er instanceof DiscordAPIError) er = er.message;
            reply(interaction, `Failed to ${type} ${target_name}...\nReason: ${er}`, true);
        });
}


export const defaultstyle = {
    type: 'normal',
    color: '#00FFFF',
    colorb: '#000000',
    title: undefined
}

export const defaultstats = {
    sleep: 0,
    lamp: 0,
    box: 0,
    kill: 0,
    popcorn: 0,
    spare: 0,
    yeet: 0,
    punch: 0,
    kick: 0,
}

export function generatecard(msg: Message | CommandInteraction | ContextMenuInteraction): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
        const errormessage = (msg: Message | Interaction) => { if (msg instanceof CommandInteraction) { reply(msg, { content: 'Failed to create card' }); return reject(); } else return reject(); };
        if (!msg.guild) return errormessage(msg);



        if (!msg.guildId) return reject();
        if (!msg.member) return reject();
        let target = msg instanceof Message ?
            msg.mentions.members?.first() ? msg.mentions.members?.first() : msg.member :
            msg.options.get('player') ? msg.options.get('player')?.user :
                msg.options.getUser('user') ? msg.options.getUser('user') :
                    msg.options.getMessage('message') ? msg.options.getMessage('message')?.author :
                        msg.user;
        if (target instanceof User) target = await msg.guild.members.fetch(target.id);
        if (!target || !(target instanceof GuildMember)) return;
        if (!target) return errormessage(msg);

        let all_messages = await (await database.child('lvl/' + msg.guildId).once('value')).val();
        let messages: number;
        if (!all_messages) messages = 0;
        else messages = all_messages[target.id];

        let prestige = await (await database.child('prestige/' + msg.guildId + '/' + target.id).once('value')).val();
        let style = await (await database.child(`card/` + target.id).once('value')).val();
        let stats = await (await database.child('stats/' + target.id).once('value')).val();
        let warnings_aux = await (await database.child('warnings/' + msg.guildId + '/' + target.id).once('value')).val();
        let guild = await (await database.child('guild/' + target.id).once('value')).val();

        if (!messages) messages = 0;
        if (!prestige) prestige = 0;

        let messages_accounted_for_prestige = accountForPrestige(messages, prestige);
        let level = getLevel(messages, prestige);
        let level_cost = getLevelCost(level);
        let level_cost_next = getLevelCost(level + 1);
        let position = await getposition(msg.guildId, target.id, all_messages);

        if (!style)
            style = defaultstyle;
        else {
            if (!style['type']) style['type'] = defaultstyle['type'];
            if (!style['color']) style['color'] = defaultstyle['color'];
            if (!style['colorb']) style['colorb'] = defaultstyle['colorb'];
        }

        if (!stats) stats = defaultstats;

        let date = target.joinedAt;
        let now = new Date(Date());
        if (!date) date = now;
        let months = (((now.getUTCFullYear() - date.getUTCFullYear()) * 12) + (now.getUTCMonth() - date.getUTCMonth()));

        let nextlevel_min_messages = level_cost_next;
        let message_to_levelup = level_cost_next - messages_accounted_for_prestige;

        let percentage = (messages_accounted_for_prestige - level_cost) / (level_cost_next - level_cost);
        let warnings = 0;
        if (warnings_aux && typeof warnings_aux == 'object' && warnings_aux.length) warnings = warnings_aux.length;

        let card = (await createCard({
            avatar_url: target.user.displayAvatarURL({ format: 'png', size: 1024 }),
            target: target,
            level: level,
            message_to_levelup: message_to_levelup,
            messages: messages,
            nextlevel_min_messages: nextlevel_min_messages,
            percentage: percentage,
            position: position,
            time_on_server: months,
            username: target.displayName,
            warnings: warnings,
            xp_bar: {
                style: style['type'],
                color_a: style['color'],
                color_b: style['color2']
            },
            guild: guild,
            prestige: prestige,
            title: style['title'],
            stats: stats
        })).toBuffer();
        return resolve(card);
    });
}

export async function warn(player: GuildMember, guildId: string, reason: string, replyMethod: TextBasedChannels | CommandInteraction) {
    let warnings = await (await database.child(`warnings/${guildId}/${player.id}`).once('value')).val();
    if (!warnings || typeof warnings != 'object') warnings = [];
    warnings.push(reason);
    let text = `${player.user.username} has been warned for ${reason}\nThey have ${warnings.length} warnings\n${warnings.length == 2 ? 'If they receive one more warning, they will be kicked from the server' : warnings.length >= 3 ? 'Therefore they were kicked from the server' : 'The next warning will result on them getting muted'}\nIf you think this warning was undeserved, talk to a Queensblade`;
    database.child(`warnings/${guildId}/${player.id}`).set(warnings);
    if (replyMethod instanceof CommandInteraction)
        replyMethod.reply(text);
    else
        say(d20, replyMethod, text);

    if (warnings.length == 2 && [triviumGuildId, testGuildId].includes(guildId)) {
        let mute_role = player.guild.roles.cache.get(guildId == triviumGuildId ? "806648884754382889" : "781715781234720768");
        if (!mute_role) return;
        await player.roles.add(mute_role);
        let text = userMention(player.id) + ' received 2 warnings and got muted';
        if (replyMethod instanceof CommandInteraction) {
            if (replyMethod.channel)
                say(d20, replyMethod.channel, text);
        } else
            say(d20, replyMethod, text);

    }
    else if (warnings.length >= 3)
        player.kick()
            .catch(() => {
                text = "Failed to kick " + player.user.username;
                if (replyMethod instanceof CommandInteraction) {
                    if (replyMethod.channel) say(d20, replyMethod.channel, text);
                }
                else
                    say(d20, replyMethod, text);
                console.error();
            }).then(() => {
                player.send('You received 3 or more warnings and got kicked from the server\nIf you think it was undeserved, please contact a moderator');
            });
}

export const mute_unmute = async (interaction: CommandInteraction | ContextMenuInteraction) => {
    let player = interaction.isContextMenu() ? interaction.options.getMember('user') : interaction.options.getMember('player');
    if (!(interaction.member instanceof GuildMember) || !(interaction.member.permissions.has("KICK_MEMBERS"))) { interaction.reply({ content: "You can't do that", ephemeral: true }); return; };
    if (!(player instanceof GuildMember)) return;
    if (player.permissions.has('KICK_MEMBERS') && interaction.commandName == 'mute') { interaction.reply({ content: 'Can\'t mute that player', ephemeral: true }); };

    let mute_role = player.guild.roles.cache.get(player.guild.id == triviumGuildId ? "806648884754382889" : "781715781234720768");
    if (!mute_role) return;

    if (interaction.commandName == 'mute')
        await player.roles.add(mute_role)
    else
        await player.roles.remove(mute_role);
    let text = interaction.commandName + 'd ' + player.user.username;
    interaction.reply(text).catch(() => { });
};
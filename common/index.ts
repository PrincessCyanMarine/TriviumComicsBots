import { database } from "..";
import { d20 } from "../clients";
import { accountForPrestige, createCard, getLevel, getLevelCost, getposition } from "../d20/function";
import { getMember, getTarget, say } from "./functions";
import { testChannelId } from "./variables";
const defaultstyle = {
    type: 'normal',
    color: '#00FFFF',
    colorb: '#000000',
}

const defaultstats = {
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

d20.on('messageCreate', async (msg) => {
    if (!msg || !msg.member || !msg.author || msg.author.bot) return;
    // if (msg.channelId != testChannelId) return;
    let args = msg.content;
    if (args.startsWith('!')) {
        args = args.replace(/!/, '');
        switch (args.split(' ')[0]) {
            case 'card_tsc':
                msg.channel.sendTyping();
                let target = msg.mentions.members?.first();
                if (!target) target = msg.member;

                let messages = await (await database.child('lvl/' + target.id).once('value')).val();

                let prestige = await (await database.child('prestige/' + target.id).once('value')).val();
                let style = await (await database.child(`card/${target.id}`).once('value')).val();
                let stats = await (await database.child('stats/' + target.id).once('value')).val();
                let warnings_aux = await (await database.child('warnings/' + msg.guildId + '/' + target.id).once('value')).val();
                let guild = await (await database.child('guild/' + target.id).once('value')).val();
                if (guild) guild = guild[0];

                let level = getLevel(messages, prestige);
                let position = await getposition(target.id);

                if (!style) style = defaultstyle;
                if (!style['type']) style['type'] = defaultstyle['type'];
                if (!style['color']) style['color'] = defaultstyle['color'];
                if (!style['colorb']) style['colorb'] = defaultstyle['colorb'];

                if (!stats) stats = defaultstats;

                let date = target.joinedAt;
                let now = new Date(Date());
                if (!date) date = now;
                let months = (((now.getUTCFullYear() - date.getUTCFullYear()) * 12) + (now.getUTCMonth() - date.getUTCMonth()));


                let nextlevel_min_messages = getLevelCost(level + 1);
                let message_to_levelup = getLevelCost(level + 1) - accountForPrestige(messages, prestige);


                let percentage = (accountForPrestige(messages, prestige) - getLevelCost(level)) / (getLevelCost(level + 1) - getLevelCost(level));
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
                msg.channel.send({ files: [card] });
                break;
        }
    }
})
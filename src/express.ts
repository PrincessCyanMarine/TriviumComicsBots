import { database } from ".";
import express from "express";
import cors from 'cors';
import bodyParser from 'body-parser';
import { createServer } from "http";
import { get } from "https";
import { accountForPrestige, createCard, createXpBar, defaultstats, defaultstyle, getLevel, getLevelCost, getposition, StatsObject } from "./d20/function";
import { triviumGuildId } from "./common/variables";
import { d20 } from "./clients";

const express_app = express();
const server = createServer(express_app);

const port = process.env.PORT || 8080;


express_app.use(cors());
express_app.use(bodyParser.urlencoded({
    extended: false
}));
express_app.use(bodyParser.json());

express_app.use('/static', express.static('./public'))

type User = {
    id: string;
    username: string;
    discriminator: number | string;
    public_flags: number;
    flags: number;
    banner: any;
    banner_color: string;
    accent_color: number;
    locale: string;
    mfa_enabled: boolean;
    avatar: string;
}

type getUserStuff = {
    statusCode: number | undefined;
    statusMessage: string | undefined;
    user: User;
}

function getUser(tokenType: string, accessToken: string): Promise<getUserStuff> {
    return new Promise((resolve, reject) => {
        get('https://discord.com/api/users/@me', {
            headers: {
                authorization: `${tokenType} ${accessToken}`,
            },
        }, (response) => {
            response.setEncoding('utf8');
            let rawData = '';
            response.on('data', (chunk) => {
                rawData += chunk;
            });
            response.on('end', () => {
                let user = JSON.parse(rawData);
                resolve({
                    user: user,
                    statusCode: response.statusCode,
                    statusMessage: response.statusMessage
                });
            });
        })
    })
}

express_app.get('/card/:tokentype/:token', async (req, res) => {
    let tokenType = req.params.tokentype;
    let accessToken = req.params.token;

    let { statusCode, user } = await getUser(tokenType, accessToken);
    database.child('card').child(user.id).once('value').then(card => res.send(card.val()));
})

express_app.post('/card/:tokentype/:token', async (req, res) => {
    let tokenType = req.params.tokentype;
    let accessToken = req.params.token;

    // console.log(req.body);

    let card = {
        type: req.body.type,
        color: req.body.color,
        color2: req.body.color2,
        title: req.body.title
    }

    let { statusCode, user } = await getUser(tokenType, accessToken);
    database.child('card').child(user.id).set(card).then(() => {
        res.send(card);
    });
})

express_app.get('/result', async (req, res) => {
    let type = req.query.type;
    let color = req.query.color;
    let color2 = req.query.color2;

    if (typeof type != 'string') type = 'normal';
    if (typeof color != 'string') color = '#000000';
    if (typeof color2 != 'string') color2 = '#000000';

    if (!color.startsWith('#')) color = '#' + color;
    if (!color2.startsWith('#')) color2 = '#' + color2;

    let canvas = await createXpBar(type, color, color2);
    res.send(canvas.toDataURL());;
})

express_app.get('/user/:tokentype/:token', async (req, res) => {
    let { user } = await getUser(req.params.tokentype, req.params.token);
    res.send(user);
});

express_app.get('/profile/:tokentype/:token', async (req, res) => {
    let guildId = triviumGuildId;
    let profile: {
        messages: number,
        position: number,
        level: number,
        prestige: number,
        avatar: string,
        message_to_levelup: number,
        style: {
            type: string,
            color: string,
            colorb: string,
            title: undefined | string
        },
        stats: StatsObject,
        guild: string,
        messages_accounted_for_prestige: number,
        level_cost: number,
        level_cost_next: number,
        months: number,
        nextlevel_min_messages: number,
        percentage: number,
        warnings: number,
        card: undefined | string
    } = {
        messages: 0,
        position: 0,
        level: 0,
        prestige: 0,
        avatar: '',
        message_to_levelup: 0,
        style: defaultstyle,
        stats: defaultstats,
        guild: '',
        messages_accounted_for_prestige: 0,
        level_cost: 0,
        level_cost_next: 0,
        months: 0,
        nextlevel_min_messages: 0,
        percentage: 0,
        warnings: 0,
        card: undefined
    }
    let { user } = await getUser(req.params.tokentype, req.params.token);
    let target = await d20.guilds.cache.get(guildId)?.members.fetch(user.id);
    if (!target) return res.send(null);
    profile.messages = await (await database.child('lvl/' + guildId + '/' + user.id).once('value')).val();
    if (!profile.messages) profile.messages = 0;
    profile.prestige = await (await database.child('prestige/' + guildId + '/' + user.id).once('value')).val();
    if (!profile.prestige) profile.prestige = 0;
    profile.level = await getLevel(profile.messages, profile.prestige);
    profile.position = await getposition(guildId, user.id);
    profile.avatar = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=1024`;


    profile.style = await (await database.child(`card/` + target.id).once('value')).val();
    profile.stats = await (await database.child('stats/' + target.id).once('value')).val();
    let warnings_aux = await (await database.child('warnings/' + guildId + '/' + target.id).once('value')).val();
    profile.guild = await (await database.child('guild/' + target.id).once('value')).val();
    if (profile.guild) profile.guild = profile.guild[0];

    profile.messages_accounted_for_prestige = accountForPrestige(profile.messages, profile.prestige);
    profile.level_cost = getLevelCost(profile.level);
    profile.level_cost_next = getLevelCost(profile.level + 1);

    if (!profile.style)
        profile.style = defaultstyle;
    else {
        if (!profile.style['type']) profile.style['type'] = defaultstyle['type'];
        if (!profile.style['color']) profile.style['color'] = defaultstyle['color'];
        if (!profile.style['colorb']) profile.style['colorb'] = defaultstyle['colorb'];
    }

    if (!profile.stats) profile.stats = defaultstats;

    let date = target.joinedAt;
    let now = new Date(Date());
    if (!date) date = now;
    profile.months = (((now.getUTCFullYear() - date.getUTCFullYear()) * 12) + (now.getUTCMonth() - date.getUTCMonth()));

    profile.nextlevel_min_messages = profile.level_cost_next;
    profile.message_to_levelup = profile.level_cost_next - profile.messages_accounted_for_prestige;

    profile.percentage = (profile.messages_accounted_for_prestige - profile.level_cost) / (profile.level_cost_next - profile.level_cost);
    if (warnings_aux && typeof warnings_aux == 'object' && warnings_aux.length) profile.warnings = warnings_aux.length;


    profile.message_to_levelup = profile.level_cost_next - profile.messages_accounted_for_prestige;


    profile.card = (await createCard({
        avatar_url: profile.avatar,
        level: profile.level,
        message_to_levelup: profile.message_to_levelup,
        messages: profile.messages,
        nextlevel_min_messages: profile.nextlevel_min_messages,
        percentage: profile.percentage,
        position: profile.position,
        stats: profile.stats,
        target: target,
        time_on_server: profile.months,
        username: user.username,
        warnings: profile.warnings,
        xp_bar: {
            style: profile.style['type'],
            color_a: profile.style['color'],
            color_b: profile.style['colorb']
        },
        guild: profile.guild,
        prestige: profile.prestige,
        title: profile.style['title'],
    })).toDataURL();



    res.send(profile);
});

server.listen(port);
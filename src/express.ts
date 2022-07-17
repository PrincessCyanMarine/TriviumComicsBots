import { database } from ".";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { createServer } from "http";
import { get } from "https";
import {
    accountForPrestige,
    createCard,
    createXpBar,
    defaultstats,
    defaultstyle,
    getLevel,
    getLevelCost,
    getposition,
    StatsObject,
} from "./d20/functions";
import { marineId, triviumGuildId } from "./common/variables";
import { d20 } from "./clients";
import { get_birds } from "./common/functions";
import { readFileSync } from "fs";
import { Harem } from "./common/harem";

const express_app = express();
const server = createServer(express_app);

const port = process.env.PORT || 8080;

express_app.use(cors());
express_app.use(
    bodyParser.urlencoded({
        extended: false,
    })
);
express_app.use(bodyParser.json());

express_app.use("/static", express.static("./public"));

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
};

type getUserStuff = {
    statusCode: number | undefined;
    statusMessage: string | undefined;
    user: User;
};

function getGuilds(tokenType: string, accessToken: string): Promise<{ id: string }[]> {
    return new Promise((resolve, reject) => {
        get(
            "https://discord.com/api/users/@me/guilds",
            {
                headers: {
                    authorization: `${tokenType} ${accessToken}`,
                },
            },
            (response) => {
                response.setEncoding("utf8");
                let rawData = "";
                response.on("data", (chunk) => {
                    rawData += chunk;
                });
                response.on("end", () => {
                    let guilds: { id: string }[] = JSON.parse(rawData);
                    resolve(guilds);
                });
            }
        );
    });
}

function getUser(tokenType: string, accessToken: string): Promise<getUserStuff> {
    return new Promise(async (resolve, reject) => {
        // let guilds: { id: string }[] = await getGuilds(tokenType, accessToken);
        get(
            "https://discord.com/api/users/@me",
            {
                headers: {
                    authorization: `${tokenType} ${accessToken}`,
                },
            },
            (response) => {
                response.setEncoding("utf8");
                let rawData = "";
                response.on("data", (chunk) => {
                    rawData += chunk;
                });
                response.on("end", () => {
                    let user = JSON.parse(rawData);
                    // user["guilds"] = guilds;
                    resolve({
                        user: user,
                        statusCode: response.statusCode,
                        statusMessage: response.statusMessage,
                    });
                });
            }
        );
    });
}

express_app.get("/user/:tokentype/:token", async (req, res) => {
    let { user } = await getUser(req.params.tokentype, req.params.token);
    res.send(user);
});

express_app.get("/profile/:tokentype/:token", async (req, res) => {
    let guildId = triviumGuildId;
    let profile: {
        messages: number;
        position: number;
        level: number;
        prestige: number;
        avatar: string;
        message_to_levelup: number;
        style: {
            type: string;
            color: string;
            colorb: string;
            title: undefined | string;
        };
        stats: StatsObject;
        guild: string;
        messages_accounted_for_prestige: number;
        level_cost: number;
        level_cost_next: number;
        months: number;
        nextlevel_min_messages: number;
        percentage: number;
        warnings: number;
        card: undefined | string;
    } = {
        messages: 0,
        position: 0,
        level: 0,
        prestige: 0,
        avatar: "",
        message_to_levelup: 0,
        style: defaultstyle,
        stats: defaultstats,
        guild: "",
        messages_accounted_for_prestige: 0,
        level_cost: 0,
        level_cost_next: 0,
        months: 0,
        nextlevel_min_messages: 0,
        percentage: 0,
        warnings: 0,
        card: undefined,
    };
    let { user } = await getUser(req.params.tokentype, req.params.token);
    let target = await d20.guilds.cache.get(guildId)?.members.fetch(user.id);
    if (!target) return res.send(null);
    profile.messages = await (await database.child("lvl/" + guildId + "/" + user.id).once("value")).val();
    if (!profile.messages) profile.messages = 0;
    profile.prestige = await (await database.child("prestige/" + guildId + "/" + user.id).once("value")).val();
    if (!profile.prestige) profile.prestige = 0;
    profile.level = await getLevel(profile.messages, profile.prestige);
    profile.position = await getposition(guildId, user.id);
    profile.avatar = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=1024`;

    profile.style = await (await database.child(`card/` + target.id).once("value")).val();
    profile.stats = await (await database.child("stats/" + target.id).once("value")).val();
    let warnings_aux = await (await database.child("warnings/" + guildId + "/" + target.id).once("value")).val();
    profile.guild = await (await database.child("guild/" + target.id).once("value")).val();
    if (profile.guild) profile.guild = profile.guild[0];

    profile.messages_accounted_for_prestige = accountForPrestige(profile.messages, profile.prestige);
    profile.level_cost = getLevelCost(profile.level);
    profile.level_cost_next = getLevelCost(profile.level + 1);

    if (!profile.style) profile.style = defaultstyle;
    else {
        if (!profile.style["type"]) profile.style["type"] = defaultstyle["type"];
        if (!profile.style["color"]) profile.style["color"] = defaultstyle["color"];
        if (!profile.style["colorb"]) profile.style["colorb"] = defaultstyle["colorb"];
    }

    if (!profile.stats) profile.stats = defaultstats;

    let date = target.joinedAt;
    let now = new Date(Date());
    if (!date) date = now;
    profile.months = (now.getUTCFullYear() - date.getUTCFullYear()) * 12 + (now.getUTCMonth() - date.getUTCMonth());

    profile.nextlevel_min_messages = profile.level_cost_next;
    profile.message_to_levelup = profile.level_cost_next - profile.messages_accounted_for_prestige;

    profile.percentage = (profile.messages_accounted_for_prestige - profile.level_cost) / (profile.level_cost_next - profile.level_cost);
    if (warnings_aux && typeof warnings_aux == "object" && warnings_aux.length) profile.warnings = warnings_aux.length;

    profile.message_to_levelup = profile.level_cost_next - profile.messages_accounted_for_prestige;

    profile.card = (
        await createCard({
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
                style: profile.style["type"],
                color_a: profile.style["color"],
                color_b: profile.style["colorb"],
            },
            guild: profile.guild,
            prestige: profile.prestige,
            title: profile.style["title"],
            harem: await Harem.get(guildId, user.id),
        })
    ).toDataURL();

    res.send(profile);
});

express_app.get("/birddex/:id?/:guild_id?", async (req, res) => {
    let id = req.params.id;
    let guild_id = req.params.guild_id || "562429293364248587";
    let bird_list = get_birds();
    let power_list = readFileSync("./bird_powers.txt", "utf-8").split("\n");
    let undef = "Ư̶̢̨̧͖̻͕̰̘̦̫̦͖̲̯̤̯̭͕̹̲̙͙͚̺͇̳̣͔̮̥͕̝̣̰̱͈̭̘̏̓̀̊̆͑̉̽͐̈̽̍͜͜͠͝ͅͅN̵̨̡̡͇̤͓̞̖̰̲̳̙͇̯͎̱̹̰̟̪̳̩̙̤̗͈̥̱̝͕̳̘̥̼͉̫͓̺͎̜̟͙̮̳̩̟̜̯̂̍̇͒̈́̽̓̈́͋̋̈͗͌̋̈́̄̓̿̇̒̑̉̈́̆͐͆̋̾̃͒̿͛̀͘͘͘͘̚̚̕͜͝D̸̢̨̨̨͖̣̘̳̙̭̹̤̹̜̼̖̹͍̩͈̹̠̫͙̫͐Ę̷̢̨͇͇͈͖̗̙͇̻̪̼̙̤͔̱͖̝̞̱̖̖̱̪̰͓̪̰̰̥̱̘͉̭̖̯͙͚̫̣̳̮̖̮͉̀̔̂̅̓͗̌̏̎̊̓̚͝ͅͅF̴̢̡̞̠̲̰̞͍͓̮͎̺̖̘͓̫͉̗̝̜̣̪͚̲̤͉̫̤̜̝̮̼̰̍̄̀̕͜͜͝Í̷̡̨̤̝̞͉̟̺̲͉̘̼̬̩͎̜̱̲̹̘̰̜͔̠͎̟̻̪̙̮̲̩̟̬̰̳̹̈́̂̈͗́̓͌̅̔̈̇̓͛̅̕̚͜͜͠N̵̡̢̢̢͓̬̳̟̰̭͈͉̯̩̮̹̣̪͎̭͖̥̫̠̜̲̯̹̹̟͔̦͈̪̼͓̼̱͓̹͙̩̗̖̱͓͂͂̓̓͑͊̃̀͜͝ͅȨ̶̛̯̼͙͓͉̟̦̮̺̤͕̪̤͚͕̩̗̻̥̞̺̱̙̫̮͉̘͕̦̎̅͑̃̃́̂̀͒͆͗̑͋̈́̈́͒͛̀̔̇̔͊̈́͘͜͝͝ͅͅḐ̴̡̨̢̧͔̣̱͕͓̙̠̻̱͎͍̦̭͔̞̲͓̩̭͍̘͎̩͖̳̜͚̖̥̞̖̰͚̬̫̜̦̙̩̟͖͕̃̓̄̔̾͑̑̇̈́̏̀͊̈́͐̉̒̆͊̆̈́̈́̎̓̌̒̽̈́͗̀̂́̔̎̓̉̄̊̎̓̚͘̕͘͜͝͠͠͠͝͝ͅͅ";
    let user_birds;
    let card_jitsu;
    let guild;
    let deck;
    let user_nick = undef;
    let guild_name = undef;

    try {
        guild = await d20.guilds.fetch(guild_id);
    } catch (err) {}
    if (id && guild) {
        guild_name = guild.name;
        user_birds = Object.entries((await database.child("birdpedia/" + guild_id + "/" + id).once("value")).val() || {});
        card_jitsu = ((await database.child(`card_dojo/cards/${guild_id}/${id}`).once("value")).val() || []).map((c: number) => [c.toString(), 0]);
        deck = ((await database.child(`card_dojo/decks/${guild_id}/${id}`).once("value")).val() || []).map((c: number) => c.toString());
        try {
            user_nick = (await guild.members.fetch(id)).displayName;
        } catch (err) {
            user_birds = [[0, -Infinity]];
            bird_list = [];
        }
    }
    res.send({ bird_list, user_birds, user_nick, guild_name, power_list, card_jitsu, deck });
});

express_app.post("/deck/:guild_id/:tokentype/:token", async (req, res) => {
    try {
        let { user } = await getUser(req.params.tokentype, req.params.token);
        let guild_id = req.params.guild_id;
        let deck: string[] | string = req.body["deck[]"];
        let owned_cards = Object.keys((await database.child("birdpedia/" + guild_id + "/" + user.id).once("value")).val() || {}).concat(
            ((await database.child(`card_dojo/cards/${guild_id}/${user.id}`).once("value")).val() || []).map((c: number) => c.toString())
        );

        console.log(owned_cards);

        if (typeof deck == "string") deck = [deck];
        if (
            !deck ||
            !Array.isArray(deck) ||
            deck.length == 0 ||
            deck.length > 20 ||
            (await has_repeated(deck)) ||
            (await player_doesnt_own_card(deck, owned_cards))
        )
            return res.sendStatus(400);

        await database.child("card_dojo/decks/" + guild_id + "/" + user.id).set(deck);
        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

function player_doesnt_own_card(deck: string[], owned: string[]): Promise<boolean> {
    return new Promise((resolve) => {
        deck.forEach((card) => {
            if (!owned.includes(card)) return resolve(true);
        });
        resolve(false);
    });
}

function has_repeated(deck: string[]): Promise<boolean> {
    return new Promise((resolve) => {
        let power_list = readFileSync("./bird_powers.txt", "utf-8").split("\n");
        let a: number[] = [];
        for (let i = 0; i <= 12; i++) a[i] = 0;
        deck.forEach((c) => a[JSON.parse(power_list[parseInt(c)]).power]++);
        a.forEach((n) => {
            if (n > 2) return resolve(true);
        });
        resolve(false);
    });
}

express_app.get("/commands", (req, res) => {
    res.send(JSON.parse(readFileSync("./commands.json", "utf-8")));
});

express_app.get("/harem/harem/:guild_id/:user_id", async (req, res) => {
    let { guild_id, user_id } = req.params;
    let harem = (await Harem.get(guild_id, user_id)).harem;
    if (!harem) return res.json(null);
    let members = await (await d20.guilds.fetch(guild_id)).members.fetch();
    if (!members.get(user_id)) return res.json(null);

    let users: { [id: string]: { displayName: string; displayAvatarURL: string } } = {};

    const addUser = (id: string) => {
        let member = members.get(id);
        if (!member) return;
        users[id] = { displayName: member.displayName, displayAvatarURL: member.displayAvatarURL({ dynamic: true, format: "png", size: 1024 }) };
    };

    harem?.members?.filter((member) => members.get(member) != null).forEach(addUser);
    harem?.isIn?.filter((member) => !(member in users) && members.get(member) != null).forEach(addUser);

    addUser(user_id);

    res.json({ ...harem, users });
});

express_app.get("/harem/guild/:guild_id", async (req, res) => {
    let { guild_id } = req.params;
    let harem = (await database.child("harem/" + guild_id).once("value")).val();
    if (!harem) return res.json(null);
    let guild = await d20.guilds.fetch(guild_id);
    let members = await guild.members.fetch();

    Object.entries(harem)
        .filter((h: any) => !h[1].ownsOne)
        .forEach((h) => delete harem[h[0]]);

    const addUser = (id: string) => {
        let member = members.get(id);
        if (!member) return;
        users[id] = { displayName: member.displayName, displayAvatarURL: member.displayAvatarURL({ dynamic: true, format: "png", size: 1024 }) };
    };

    let users: { [id: string]: { displayName: string; displayAvatarURL: string } } = {};

    Object.keys(harem).forEach(addUser);

    let guild_info = { name: guild.name };

    res.json({ harems: harem, users, guild: guild_info });
});

express_app.get("/card/getInfo", async (req, res) => {
    const { tokenType, accessToken } = req.query;
    let { user } = await getUser(tokenType as string, accessToken as string);
    if (!user) return res.sendStatus(401);
    let style = await (await database.child(`card/` + user.id).once("value")).val();
    res.json(style);
});
express_app.post("/card/getInfo", async (req, res) => {
    const { tokenType, accessToken } = req.query;
    let { user } = await getUser(tokenType as string, accessToken as string);
    if (!user) return res.sendStatus(401);
    let { style } = req.body;
    console.log(style);
    if (!style) return res.sendStatus(400);
    await database.child(`card/` + user.id).set(style);
    res.sendStatus(200);
});

server.listen(port, () => {
    console.log("Server is listening on http://localhost:" + port);
});

import { ActivityType, Client, Intents, WebhookClient } from "discord.js";
import { config } from "dotenv";
import { changeActivities } from "./common/functions";
config();


export const krystal = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_INTEGRATIONS, Intents.FLAGS.GUILD_MEMBERS]
});
krystal.login(process.env.BOT_KRYSTAL_TOKEN);
krystal.on('ready', () => {
    console.log(`${krystal.user ? krystal.user.tag : "Sadie"} is ready!!!`);
    changeActivities();
});

export const sadie = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});
sadie.login(process.env.BOT_SADIE_TOKEN);
sadie.on('ready', () => {
    console.log(`${sadie.user ? sadie.user.tag : "Sadie"} is ready!!!`);
    changeActivities();
});

export const d20 = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_INTEGRATIONS]
});
d20.login(process.env.BOT_D20_TOKEN);
d20.on('ready', () => { console.log(`${d20.user ? d20.user.tag : "D20"} is ready!!!`) });


export const ray = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_INTEGRATIONS]
});
ray.login(process.env.BOT_RAY_TOKEN);
ray.on('ready', () => {
    console.log(`${ray.user ? ray.user.tag : "Ray"} is ready!!!`);
    changeActivities();
});


export const eli = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_PRESENCES]
});
eli.login(process.env.BOT_ELI_TOKEN);
eli.on('ready', () => {
    console.log(`${eli.user ? eli.user.tag : "Eli"} is ready!!!`);
    changeActivities();
});

export const mod_alert_webhook = (testing: boolean) => testing ?
    new WebhookClient({
        url: process.env.WEBHOOK_TESTING_CHANNEL || ""
    }) :
    new WebhookClient({
        url: process.env.WEBHOOK_ALERT_CHANNEL || ""
    });

export const clients: { [bot: string]: Client } = {
    'd20': d20,
    'sadie': sadie,
    'krystal': krystal,
    'eli': eli,
    'ray': ray,
}

// IDs are already public
export const id2bot: { [bot: string]: string } = {
    "743606862578057277": 'd20',
    "622898538514350085": 'sadie',
    "620634675454541844": 'krystal',
    "666872683530813441": 'eli',
    "666795899879424020": 'ray',
}

export type CustomActivity = [string, Exclude<ActivityType, "CUSTOM">, string, (string | Buffer)?, string?, string?];
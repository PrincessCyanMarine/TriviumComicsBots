import { ActivityType, Client, Intents, WebhookClient } from "discord.js";
import { config } from "dotenv";
import { changeActivities } from "./common/functions";
config();

const intents = [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_INTEGRATIONS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_PRESENCES];

export var krystal = new Client({ intents }),
    sadie = new Client({ intents }),
    ray = new Client({ intents }),
    eli = new Client({ intents }),
    d20 = new Client({ intents }),
    cerby = new Client({ intents }),
    sieg = new Client({ intents });

krystal.login(process.env.BOT_KRYSTAL_TOKEN)
sadie.login(process.env.BOT_SADIE_TOKEN)
ray.login(process.env.BOT_RAY_TOKEN)
eli.login(process.env.BOT_ELI_TOKEN)
d20.login(process.env.BOT_D20_TOKEN)
cerby.login(process.env.BOT_CERBY_TOKEN)
sieg.login(process.env.BOT_SIEG_TOKEN)

var client_list = [krystal, sadie, ray, eli, cerby, sieg];
client_list.forEach(client => {
    client.on('ready', () => {
        if (!client.user) throw ("Something went wrong with client init");
        console.log(`${client.user.tag} is ready!!!`);
        changeActivities();
    });
})

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
    'cerberus': cerby,
    'siegfried': sieg,
}

// IDs are already public
export const id2bot: { [bot: string]: string } = {
    "743606862578057277": 'd20',
    "622898538514350085": 'sadie',
    "620634675454541844": 'krystal',
    "666872683530813441": 'eli',
    "666795899879424020": 'ray',
    "711241945149734914": 'cerberus',
    "723938416139567154": 'siegfried',
}

export type CustomActivity = [string, Exclude<ActivityType, "CUSTOM">, string, (string | Buffer)?, string?, string?];
import { ActivityType, Client, Intents, ThreadChannel, WebhookClient } from "discord.js";
import { config } from "dotenv";
import { changeActivities, random_from_array, wait } from "./common/functions";
import { triviumGuildId } from "./common/variables";
import { Message } from "discord.js";
config();

const intents = [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_INTEGRATIONS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_PRESENCES,
    Intents.FLAGS.GUILD_MESSAGE_TYPING,
];

export var krystal = new Client({ intents }),
    sadie = new Client({ intents }),
    ray = new Client({ intents }),
    eli = new Client({ intents }),
    d20 = new Client({ intents }),
    cerby = new Client({ intents }),
    sieg = new Client({ intents });

krystal.login(process.env.BOT_KRYSTAL_TOKEN);
sadie.login(process.env.BOT_SADIE_TOKEN);
ray.login(process.env.BOT_RAY_TOKEN);
eli.login(process.env.BOT_ELI_TOKEN);
d20.login(process.env.BOT_D20_TOKEN);
cerby.login(process.env.BOT_CERBY_TOKEN);
sieg.login(process.env.BOT_SIEG_TOKEN);

sieg.on("ready", () => {
    sieg.user?.setStatus("invisible");
});

const all_clients_ready = () => {
    for (let client of client_list) if (!client.isReady()) return false;
    return true;
};

export var client_list = [krystal, sadie, ray, eli, cerby, sieg];
client_list.forEach((client) => {
    client.on("ready", () => {
        // client.guilds.fetch(triviumGuildId).then(async (guild) => {
        //     let channels = await guild.channels.fetchActiveThreads();
        //     for (let channel of channels.threads.values()) {
        //         if (!channel?.isThread()) continue;
        //         await channel.join();
        //         let msg = await channel.fetchStarterMessage();
        //         msg?.react("🍒");
        //     }
        // });
        if (!client.user) throw "Something went wrong with client init";
        console.log(`${client.user.tag} is ready!!!`);
        changeActivities();
        if (all_clients_ready()) {
            console.log("All clients ready");
            require("./commands");
        }
    });
    try {
        client.on("messageCreate", async (msg) => {
            if (!msg.channel.isThread()) return;
            try {
                await warReact(msg);
                await wait(250);
            } catch (err) {
                console.log("Error in war reaction: Inner");
            }
        });
    } catch (err) {
        console.log("Error in war reaction: Outer");
    }
});

let warReact = (msg: Message) => {
    try {
        switch (msg.channel.id) {
            case "1103842715642384435":
                return msg.react("🍒");
            case "1115738435752308807":
                return msg.react("🖌️");
            case "1115836693971476481":
                return msg.react("🥭");

            case "1116005403533258804":
                return msg.react("🍓");
            case "1115748763726790776":
                return msg.react("🥚");
            default:
                try {
                    return msg.react(random_from_array(["🍒", "🖌️", "🥭", "🍓", "🥚"]));
                } catch (err) {
                    console.log("Error in war reaction: Default");
                }
        }
    } catch (err) {
        console.log("Error in war reaction: Switch");
    }
};

export const mod_alert_webhook = (testing: boolean) =>
    testing
        ? new WebhookClient({
              url: process.env.WEBHOOK_TESTING_CHANNEL || "",
          })
        : new WebhookClient({
              url: process.env.WEBHOOK_ALERT_CHANNEL || "",
          });

export const logwebhook = (testing: boolean) =>
    testing
        ? new WebhookClient({
              url: process.env.WEBHOOK_TESTING_CHANNEL || "",
          })
        : new WebhookClient({
              url: process.env.WEBHOOK_LOGGING_CHANNEL || "",
          });

export const clients: { [bot: string]: Client } = {
    d20: d20,
    sadie: sadie,
    krystal: krystal,
    eli: eli,
    ray: ray,
    cerberus: cerby,
    siegfried: sieg,
};

// IDs are already public
export const id2bot: { [bot: string]: string } = {
    "743606862578057277": "d20",
    "622898538514350085": "sadie",
    "620634675454541844": "krystal",
    "666872683530813441": "eli",
    "666795899879424020": "ray",
    "711241945149734914": "cerberus",
    "723938416139567154": "siegfried",
};

export type CustomActivity = [string, Exclude<ActivityType, "CUSTOM"> | undefined, string | undefined, (string | Buffer)?, string?, string?];

import { Client, Intents } from "discord.js";
import { config } from "dotenv";
config();


export const krystal = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_INTEGRATIONS]
});
krystal.login(process.env.BOT_KRYSTAL_TOKEN);
krystal.on('ready', () => { console.log(`${krystal.user ? krystal.user.tag : "Sadie"} is ready!!!`) });

export const sadie = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});
sadie.login(process.env.BOT_SADIE_TOKEN);
sadie.on('ready', () => { console.log(`${sadie.user ? sadie.user.tag : "Sadie"} is ready!!!`) });

export const d20 = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_INTEGRATIONS]
});
d20.login(process.env.BOT_D20_TOKEN);
d20.on('ready', () => { console.log(`${d20.user ? d20.user.tag : "D20"} is ready!!!`) });


export const ray = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});
ray.login(process.env.BOT_RAY_TOKEN);
ray.on('ready', () => { console.log(`${ray.user ? ray.user.tag : "Ray"} is ready!!!`) });


export const eli = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});
eli.login(process.env.BOT_ELI_TOKEN);
eli.on('ready', () => { console.log(`${eli.user ? eli.user.tag : "Eli"} is ready!!!`) });





export const clients: { [bot: string]: Client } = {
    'd20': d20,
    'sadie': sadie,
    'krystal': krystal,
    'eli': eli,
    'ray': ray,
}
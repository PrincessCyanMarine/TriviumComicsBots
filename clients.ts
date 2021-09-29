import { Client, Intents } from "discord.js";
import { config } from "dotenv";
config();

export const krystal = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});
krystal.login(process.env.BOT_KRYSTAL_TOKEN);
krystal.on('ready', () => { console.log(`${krystal.user ? krystal.user.tag : "Sadie"} is ready!!!`) });

export const sadie = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});
sadie.login(process.env.BOT_SADIE_TOKEN);
sadie.on('ready', () => { console.log(`${sadie.user ? sadie.user.tag : "Sadie"} is ready!!!`) });

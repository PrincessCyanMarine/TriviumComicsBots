import { Client, Intents } from "discord.js";
import { config } from "dotenv";
import { writeFileSync } from "fs"
// import admin from 'firebase-admin'
config();

// admin.initializeApp({
//     credential: admin.credential.applicationDefault(),
//     databaseURL: 'https://tcbotsrewrite.firebaseio.com'
// });

// export const database = admin.database().ref();


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

export const d20 = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});
d20.login(process.env.BOT_D20_TOKEN);
d20.on('ready', () => { console.log(`${d20.user ? d20.user.tag : "D20"} is ready!!!`) });


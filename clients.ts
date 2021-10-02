import { Client, Intents } from "discord.js";
import { config } from "dotenv";
import admin from 'firebase-admin'
import { exit } from "process";
config();

if (!process.env.FIREBASE_PRIVATE_KEY) exit(1);
const private_key = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')

admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: private_key,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    }),
    databaseURL: process.env.DATABASE_URL
});
export const database = admin.database().ref();


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


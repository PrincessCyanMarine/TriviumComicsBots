import "./express"

import admin from 'firebase-admin'
import { exit } from "process";
import { config } from "dotenv"
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

import "./krystal/index"
import "./sadie/index"
import "./d20/index"
import "./slash/index"
import "./common/index"
export const testing = process.env.TESTING == "true";
console.log("Testing: " + testing);

// import { existsSync, rmdirSync } from "fs";
// if (existsSync(".cache")) rmdirSync(".cache", { recursive: true });

let oldConsoleLog = console.log;
let oldConsoleError = console.error;
let oldConsoleWarn = console.warn;
let oldConsoleInfo = console.info;

import { config } from "dotenv";
config();
import { WebhookClient } from "discord.js";
let logger_webhook = new WebhookClient({
    url: process.env.WEBHOOK_LOGS_CHANNEL || "",
});

const newConsole = (old: (...args: any[]) => void, type: string, color: number, ...args: any[]) => {
    old(...args);
    if (testing) return;
    let content = args.map((a) => `${a}`).join(", ");
    let multiple = content.length > 2000;
    let i = 0;
    do {
        logger_webhook.send({
            embeds: [
                {
                    title: multiple ? `${type} message (${i++})` : `${type} message`,
                    description: content.slice(0, 2000),
                    color,
                },
            ],
        });
        content = content.slice(2000);
    } while (content.length > 0);
};

console.log = (...args: any[]) => {
    newConsole(oldConsoleLog, "Log", 0x00ff00, ...args);
};
console.error = (...args: any[]) => {
    newConsole(oldConsoleError, "Error", 0xff0000, ...args);
};
console.warn = (...args: any[]) => {
    newConsole(oldConsoleWarn, "Warn", 0xffff00, ...args);
};
console.info = (...args: any[]) => {
    newConsole(oldConsoleInfo, "Info", 0x0000ff, ...args);
};

require("https").globalAgent.options.ca = require("fs").readFileSync(
    "node_modules/node_extra_ca_certs_mozilla_bundle/ca_bundle/ca_intermediate_root_bundle.pem"
);

// import "./express";

import admin from "firebase-admin";
import { exit } from "process";
if (!process.env.FIREBASE_PRIVATE_KEY) exit(1);
const private_key = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");

admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: private_key,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    databaseURL: process.env.DATABASE_URL,
});
export const database = admin.database().ref();

import "./krystal/index";
import "./sadie/index";
import "./d20/index";
import "./common/index";
import "./eli/index";
import "./ray/index";
import "./interactions/index";
import "./games/index";

export const testing = process.env.TESTING == "true";
console.log("Testing: " + testing);

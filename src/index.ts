require("https").globalAgent.options.ca = require("fs").readFileSync(
    "node_modules/node_extra_ca_certs_mozilla_bundle/ca_bundle/ca_intermediate_root_bundle.pem"
);

import "./express";

import admin from "firebase-admin";
import { exit } from "process";
import { config } from "dotenv";
config();
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

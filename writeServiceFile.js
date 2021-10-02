"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
var dotenv_1 = require("dotenv");
var fs_1 = require("fs");
(0, dotenv_1.config)();
if (process.env.GOOGLE_APPLICATION_CREDENTIALS && process.env.SERVICEACCOUNT)
    (0, fs_1.writeFileSync)(process.env.GOOGLE_APPLICATION_CREDENTIALS, process.env.SERVICEACCOUNT.replace(/\$\(INSETNEWLINEHERE\)/g, '\n'));
import { config } from "dotenv";
import { writeFileSync } from "fs";
config();

if (process.env.GOOGLE_APPLICATION_CREDENTIALS && process.env.SERVICEACCOUNT)
    writeFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, process.env.SERVICEACCOUNT.replace(/\$\(INSETNEWLINEHERE\)/g, '\n'));
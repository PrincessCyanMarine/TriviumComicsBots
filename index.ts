import "./krystal/index"
import "./sadie/index"
import "./d20/index"
import { readFileSync } from "fs"

if (process.env.GOOGLE_APPLICATION_CREDENTIALS) console.log(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf-8'));
else console.log('A');
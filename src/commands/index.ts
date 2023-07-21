import { readdirSync } from "fs";
import { parse } from "path";
let dir = parse(require.resolve(".")).dir;
readdirSync(dir)
    .filter((f) => !f.startsWith("index"))
    .forEach((file) => require(dir + "/" + file));
// import "./EmojiRotation";

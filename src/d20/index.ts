import { testing } from "..";
import { d20 } from "../clients";
import { ignore_message } from "../common/functions";
import { ignore_channels, testChannelId, TIME } from "../common/variables";
import { EmojiCycler } from "./EmojiCycler";
import { testCommands } from "./commandHandler";
import { countMessages, d20TimedFunction } from "./functions";

d20.on("ready", () => {
    if (testing) return;
    new EmojiCycler("562429293364248587", "613507549085302796");
    d20TimedFunction();
    setInterval(d20TimedFunction, TIME.MINUTES * 30);
});

d20.on("messageCreate", (msg) => {
    if (ignore_message(msg, d20)) return;
    countMessages(msg);
    testCommands(msg);
});

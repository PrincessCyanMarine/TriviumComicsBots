import { testing } from "..";
import { d20 } from "../clients";
import { ignore_message } from "../common/functions";
import { ignore_channels, testChannelId } from "../common/variables";
import { testCommands } from "./commandHandler";
import { countMessages } from "./functions";

d20.on('messageCreate', (msg) => {
    if (ignore_message(msg, d20)) return;
    countMessages(msg);
    testCommands(msg);
});
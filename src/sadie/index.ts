import { testing } from "..";
import { sadie } from "../clients";
import { ignore_message } from "../common/functions";
import { ignore_channels, testChannelId } from "../common/variables";
import { testCommands } from "./commandHandler";


sadie.on('messageCreate', (msg) => {
    if (ignore_message(msg, sadie)) return;
    testCommands(msg);
});

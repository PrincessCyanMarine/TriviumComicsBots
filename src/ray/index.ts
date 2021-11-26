import { testing } from "..";
import { ray } from "../clients";
import { ignore_message } from "../common/functions";
import { ignore_channels, testChannelId } from "../common/variables";
import { testCommands } from "./commandHandler";
import { roleplay } from "./functions";

ray.on('messageCreate', (msg) => {
    roleplay(msg);
    if (ignore_message(msg, ray)) return;
    testCommands(msg);
});
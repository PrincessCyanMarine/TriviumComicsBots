import { testing } from "..";
import { eli } from "../clients";
import { ignore_message } from "../common/functions";
import { ignore_channels, testChannelId } from "../common/variables";
import { testCommands } from "./commandHandler";

eli.on('messageCreate', (msg) => {
    if (ignore_message(msg, eli)) return;
    testCommands(msg);
});
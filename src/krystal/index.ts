import { testing } from "..";
import { krystal } from "../clients";
import { ignore_message } from "../common/functions";
import { ignore_channels, testChannelId } from "../common/variables";
import { testCommands } from "./commandHandler";
import { testWebtoonEpisode } from "./functions";

testWebtoonEpisode();
//setInterval(testWebtoonEpisode, 1200000);

krystal.on("messageCreate", (msg) => {
    if (ignore_message(msg, krystal)) return;
    testCommands(msg);
});

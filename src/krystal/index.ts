import { testing } from "..";
import { krystal } from "../clients";
import { ignore_channels, testChannelId } from "../common/variables";
import { testCommands } from "./commandHandler";
import { testWebtoonEpisode } from "./functions";

testWebtoonEpisode();
// setInterval(testWebtoonEpisode, 1200000);

krystal.on('messageCreate', (msg) => {
    if (!msg || !msg.member || !msg.author || msg.author.bot) return;
    if (msg.content.startsWith('!')) return;
    if (ignore_channels.includes(msg.channel.id)) return;
    if (testing && msg.channelId != testChannelId) return;
    else if (!testing && msg.channelId == testChannelId) return;
    testCommands(msg);
});

import { BaseGuildTextChannel } from "discord.js";
import { testing } from "..";
import { d20, mod_alert_webhook } from "../clients";
import { ignore_message } from "../common/functions";
import { ignore_channels, testChannelId, testGuildId, TIME, triviumGuildId } from "../common/variables";
import { EmojiCycler } from "./EmojiCycler";
import { testCommands } from "./commandHandler";
import { countMessages, d20TimedFunction } from "./functions";

d20.on("ready", () => {
    d20.guilds.fetch(triviumGuildId).then((guild) => {
        guild.commands.fetch().then((commands) => {
            for (const [id, command] of commands) {
                console.log(command.name, id);
            }
        });
    });
    if (testing) return;
    mod_alert_webhook(testing).send("Bots have restarted");
    new EmojiCycler("562429293364248587", "613507549085302796");
    d20TimedFunction();
    setInterval(d20TimedFunction, TIME.MINUTES * 30);
});

d20.on("messageCreate", (msg) => {
    if (ignore_message(msg, d20)) return;
    countMessages(msg);
    testCommands(msg);
});

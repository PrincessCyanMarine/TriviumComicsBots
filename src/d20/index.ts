import { MessageEmbed } from "discord.js";
import { testing } from "..";
import { d20, logwebhook, mod_alert_webhook } from "../clients";
import { ignore_message } from "../common/functions";
import { testChannelId, TIME, triviumGuildId } from "../common/variables";
import { EmojiCycler } from "./EmojiCycler";
import { testCommands } from "./commandHandler";
import { countMessages, d20TimedFunction } from "./functions";
import { msg2embed } from "../common/functions";

d20.on("ready", () => {
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

d20.on("messageDelete", (msg) => {
    if (msg.author?.bot) return;
    if (!testing && msg.guildId != triviumGuildId) return;
    if (testing && msg.channelId != testChannelId) return;
    let webhook = logwebhook(testing);
    webhook.send({
        content: `Message removed in ${msg.url}`,
        embeds: [msg2embed(msg)[0].setColor("RED")],
    });
});

d20.on("messageUpdate", (oldMessage, newMessage) => {
    console.log(testing, oldMessage.guildId != triviumGuildId, oldMessage.author?.bot);
    if (oldMessage.author?.bot) return;
    if (!testing && oldMessage.guildId != triviumGuildId) return;
    if (testing && oldMessage.channelId != testChannelId) return;
    let webhook = logwebhook(testing);
    console.log(webhook);
    webhook.send({
        content: `Message edited in ${oldMessage.url}`,
        embeds: [
            new MessageEmbed()
                .setAuthor({ name: oldMessage.author?.username || "UNKNOWN", iconURL: oldMessage.author?.displayAvatarURL(), url: oldMessage.url })
                .setTitle("Go to original")
                .setURL(oldMessage.url)
                .addFields(
                    { name: "Old message", value: oldMessage.content ?? "MISSING_CONTENT" },
                    { name: "New message", value: newMessage.content ?? "MISSING_CONTENT" }
                )
                .setTimestamp(newMessage.createdTimestamp)
                .setColor("YELLOW"),
        ],
    });
});

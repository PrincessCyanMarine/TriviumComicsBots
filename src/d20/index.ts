import { MessageEmbed, TextChannel } from "discord.js";
import { database, testing } from "..";
import { client_list, clients, d20, krystal, logwebhook, mod_alert_webhook, sadie } from "../clients";
import { ignore_message, random_from_array, randomchance, spawnAsync, wait } from "../common/functions";
import { marineId, testChannelId, TIME, triviumGuildId } from "../common/variables";
import { EmojiCycler } from "./EmojiCycler";
import { emojiReact, testCommands } from "./commandHandler";
import { countMessages, d20TimedFunction } from "./functions";
import { msg2embed } from "../common/functions";
import { exec } from "child_process";
import { userMention } from "@discordjs/builders";
import { addMessageCommand } from "../interactions/slash/common";
import { addExclamationCommand } from "../common";

d20.on("ready", () => {
    require("../app/index");
    if (testing) return;
    mod_alert_webhook(testing).send("Bots have restarted");
    // new EmojiCycler("562429293364248587", "613507549085302796");
    d20TimedFunction();
    setInterval(d20TimedFunction, TIME.MINUTES * 30);

});

d20.on("messageCreate", async (msg) => {
    if (ignore_message(msg, d20)) return;
    countMessages(msg);
    testCommands(msg);
    emojiReact(msg).catch(() => {});
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
    // console.log(testing, oldMessage.guildId != triviumGuildId, oldMessage.author?.bot);
    if (!newMessage.editedAt) return;
    if (oldMessage.author?.bot) return;
    if (!testing && oldMessage.guildId != triviumGuildId) return;
    if (testing && oldMessage.channelId != testChannelId) return;
    let webhook = logwebhook(testing);
    // console.log(webhook);
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

d20.on("messageCreate", (msg) => {
    if (msg.author.id != marineId) return;
    if (msg.channel.id != "1164622025969639565") return;
    if (testing) return;
    if (msg.content.startsWith("!")) return;

    exec(msg.content, (err, stdout, stderr) => {
        if (err) console.error(err);
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
    });
});

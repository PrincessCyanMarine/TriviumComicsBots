import { MessageEmbed } from "discord.js";
import { testing } from "..";
import { client_list, clients, d20, krystal, logwebhook, mod_alert_webhook } from "../clients";
import { ignore_message, random_from_array, wait } from "../common/functions";
import { testChannelId, TIME, triviumGuildId } from "../common/variables";
import { EmojiCycler } from "./EmojiCycler";
import { testCommands } from "./commandHandler";
import { countMessages, d20TimedFunction } from "./functions";
import { msg2embed } from "../common/functions";

d20.on("ready", () => {
    if (testing) return;
    mod_alert_webhook(testing).send("Bots have restarted");
    // new EmojiCycler("562429293364248587", "613507549085302796");
    d20TimedFunction();
    setInterval(d20TimedFunction, TIME.MINUTES * 30);
});

d20.on("messageCreate", async (msg) => {
    if (msg.guild) {
        let emojis = msg.content.match(
            /(<:.+?:[0-9]+?>)|(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/gi
        );
        if (emojis)
            for (const client of client_list) {
                let channel = await client.channels.fetch(msg.channelId);
                if (!channel?.isText()) return;
                let message = await channel.messages.fetch(msg.id);
                if (Math.floor(Math.random() * 3) == 0) {
                    await message.react(random_from_array(emojis));
                    await wait(250 + Math.floor(Math.random() * 500));
                }
                if (Math.floor(Math.random() * 10) == 0) {
                    let guildEmojis = await msg.guild.emojis.fetch();
                    let emoji = guildEmojis.random();
                    if (emoji) {
                        await message.react(emoji);
                        await wait(250 + Math.floor(Math.random() * 500));
                    }
                }
            }
    }
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

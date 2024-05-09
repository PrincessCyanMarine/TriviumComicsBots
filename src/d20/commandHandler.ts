import { Message, MessageActionRow, MessageButton, GuildMember } from "discord.js";
import { testing } from "..";
import { client_list, mod_alert_webhook } from "../clients";
import { msg2embed, random_from_array, wait } from "../common/functions";
import { alert_role_id, triviumGuildId } from "../common/variables";
import { warn } from "./functions";

export function testCommands(msg: Message) {
    if (!testing && msg.guildId != triviumGuildId) return;
    let args = msg.content.toLowerCase().replace(/\s/g, "").replace(/anime-?(boy)|(girl)/, "");
    // console.log(args);
    const free = args.match(/free/gi);
    if (
        (args.match(/(e-?girl)|(e-?boy)|(onlyfan)|(nitro)|(nudes?)|(18\+)|(\+18)/gi) && (free || args.match(/(.+?\..+?)|(http)/gi))) ||
        (args.match(/https?:\/\/discord\.gg.+/))
    )
        nitro(msg);
    else for (let { title, description } of msg.embeds) if (title?.includes("nitro") || description?.includes("nitro")) nitro(msg);

    /* let slur_detection = args.match(/n(e|ig)g[re]?[orae]|fag|nip/gi);
    if (slur_detection) {
        console.log(slur_detection.join(', '));
        mod_alert_webhook(testing)
            .send({
                content: `<@&${alert_role_id}> please confirm the message below doesn\'t include a slur (flagged: "${slur_detection.join(', ')}")`,
                embeds: msg2embed(msg),
                username: "Mod alert - Slur!",
                avatarURL: "https://github.com/PrincessCyanMarine/TriviumComicsBots/blob/master/assets/krystal/avatars/burn.png?raw=true",
            });
    } */
}

export async function emojiReact(msg: Message) {
    if (msg.guild) {
        let emojis = msg.content.match(
            /(<:.+?:[0-9]+?>)|(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/gi
        );
        for (const client of client_list) {
            let channel = await client.channels.fetch(msg.channelId);
            if (!channel?.isText()) return;
            let message = await channel.messages.fetch(msg.id);
            if (emojis) {
                if (Math.floor(Math.random() * 3) == 0) {
                    try {
                        await message.react(random_from_array(emojis));
                    } catch (err) {
                        console.error(err);
                    }
                    await wait(250 + Math.floor(Math.random() * 500));
                }
                if (Math.floor(Math.random() * 10) == 0) {
                    let guildEmojis = await msg.guild.emojis.fetch();
                    let emoji = guildEmojis.random();
                    if (emoji) {
                        try {
                            await message.react(emoji);
                        } catch (err) {
                            console.error(err);
                        }
                        await wait(250 + Math.floor(Math.random() * 500));
                    }
                }
            } else if (Math.floor(Math.random() * 30) == 0) {
                let guildEmojis = await msg.guild.emojis.fetch();
                let emoji = guildEmojis.random();
                if (emoji) {
                    try {
                        await message.react(emoji);
                    } catch (err) {
                        console.error(err);
                    }
                    await wait(250 + Math.floor(Math.random() * 500));
                }
            }
        }
    }
}

async function nitro(msg: Message) {
    let key;
    if (msg.member && msg.member instanceof GuildMember && msg.guild) key = await warn(msg.member, msg.guild.id, "Possible scam", msg.channel);
    console.log(key);
    let embeds = msg2embed(msg);
    embeds[embeds.length - 1].setColor("RED");
    mod_alert_webhook(testing).send({
        content: `<@&${alert_role_id}> please confirm the message below isn\'t a scam`,
        username: "Mod alert - Possible scam!!",
        avatarURL: "https://github.com/PrincessCyanMarine/TriviumComicsBots/blob/master/assets/krystal/avatars/burn.png?raw=true",
        embeds,
        components: [
            new MessageActionRow().addComponents(
                button_message_link(msg.url),
                new MessageButton()
                    .setStyle("DANGER")
                    .setLabel("Remove warning")
                    .setCustomId(`unwarn?guild=${msg.guildId}&user=${msg.author.id}&key=${key}`)
                    .setDisabled(!key)
            ),
        ],
    });
}

const button_message_link = (url: string) => new MessageButton().setStyle("LINK").setURL(url).setLabel("Go to message");

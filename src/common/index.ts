import {
    AnyChannel,
    BaseMessageComponentOptions,
    Client,
    Collection,
    GuildMember,
    Message,
    MessageActionRow,
    MessageActionRowOptions,
    MessageAttachment,
    MessageButton,
    MessageEmbed,
    MessageSelectMenu,
    TextChannel,
} from "discord.js";
import { database, testing } from "..";
import { cerby, clients, CustomActivity, d20, eli, krystal, ray, sadie } from "../clients";
import { generatecard, get_rank_message, prestige } from "../d20/functions";
import { eating, killing } from "../krystal/functions";
import {
    changeActivity,
    detectEmoji,
    getCharacterEmoji,
    get_birds,
    notificationCult,
    random_from_array,
    update,
    say,
    spawnAsync,
    wait,
    restart,
    sendCardCustomizationMessage,
    gitpull,
    createCharacterCard,
    getMana,
} from "./functions";
import {
    colors,
    command_list,
    dodoId,
    ignore_channels,
    isRestarting,
    marineId,
    notificationChannel,
    setRestarting,
    testChannelId,
    testGuildId,
    triviumGuildId,
} from "./variables";
import { ActionRowBuilder, channelMention, userMention } from "@discordjs/builders";
import { lamp, sleep } from "../attachments";
import { playrps, rps_bots, rps_bots_emojis } from "../games/rockpaperscissors";
import { summon, SUMMON_NAMES } from "../games/summon";
import { krystal_activities } from "../krystal/activities";
import { sadie_activities } from "../sadie/activities";
import { eli_activities } from "../eli/activities";
import { ray_activities } from "../ray/activities";
import { Calculator } from "../games/calculator";
// import { Help } from "./help";
import { Harem } from "./harem";
import axios from "axios";
import { EmojiCycler } from "../d20/EmojiCycler";
import { spawn } from "child_process";

const _commands: { names: string[]; callback: (msg: Message, args: string[]) => Promise<void> }[] = [];
export const addExclamationCommand = (names: string | string[], callback: (msg: Message, args: string[]) => Promise<void>) => {
    if (!Array.isArray(names)) names = [names];
    _commands.push({
        names,
        callback,
    });
};

d20.on("messageCreate", async (msg) => {
    if (!msg || !msg.member || !msg.author || msg.author.bot) return;
    if (ignore_channels.includes(msg.channel.id)) return;
    if (testing && msg.channelId != testChannelId) return;
    else if (!testing && msg.channelId == testChannelId) return;
    let args = msg.content.toLowerCase();
    let options = args.split(" ");
    if (args.startsWith("!")) {
        args = args.replace(/!/, "");
        let command = args.split(" ")[0];
        switch (command) {
            case "card":
            case "profile":
                msg.channel.sendTyping();
                msg.channel.send({ files: [await generatecard(msg)] });
                break;
            case "prestige":
                prestige(msg);
                break;
            case "c":
                msg.channel.sendTyping();
                sendCardCustomizationMessage(msg, false, undefined, undefined, ["slow", "card"].includes(options[1]));
                break;
            // case "profile":
            //     let target = msg.mentions.members?.first() ? msg.mentions.members?.first() : msg.member;
            //     const profile = [
            //         () => {
            //             say(d20, msg.channel, "You can customize your card at https://www.cyanmarine.net/tc/card/customize");
            //         },
            //         () => {
            //             msg.channel.sendTyping();
            //             generatecard(msg).then((card) => {
            //                 msg.channel.send({ files: [card] });
            //             });
            //         },
            //         () => {
            //             say(krystal, msg.channel, `!profile <@${target?.id}>`);
            //         },
            //         () => {
            //             killing(msg, target?.user, "normal", "Cyan asked me to kill whoever did that :GMKrystalDevious: :GMKrystalDevious:");
            //         },
            //     ];
            //     profile[Math.floor(Math.random() * profile.length)]();
            //     break;
            case "roll":
                if (!options[1]) {
                    say(ray, msg.channel, "Missing arguments!");
                    return;
                }
                let dice: number, ammount: number;
                const parseNum = (str: string) => {
                    let num = parseInt(str);
                    if (str.includes("e")) num *= 10 ** parseInt(str.split("e")[1]);
                    return num;
                };
                if (options[1].includes("d")) {
                    dice = parseNum(options[1].split("d")[1]);
                    if (options[1].split("d")[0] == "") ammount = 1;
                    else ammount = parseNum(options[1].split("d")[0]);
                } else {
                    dice = parseNum(options[1]);
                    ammount = 1;
                }
                if (isNaN(dice) || isNaN(ammount) || dice < 0 || ammount < 0) {
                    say(ray, msg.channel, "Incorrect arguments!");
                    return;
                }
                if (ammount > 9999) {
                    say(ray, msg.channel, "Number too big!");
                    return;
                }

                let results: number[] = [];

                let i: number;
                for (i = 0; i < ammount; i++) results.push(Math.ceil(Math.random() * dice));

                if (ammount == 1 && dice == 20) {
                    say(ray, msg.channel, { files: [new MessageAttachment(`./assets/ray/roll/${results[0]}.gif`, "Roll.gif")] });
                    return;
                }

                let total = 0;
                results.forEach((roll) => {
                    total += roll;
                });

                let rolltext = ammount > 1 ? `${total.toString()}\n\`\`\`${results.join(", ")}\`\`\`` : total.toString();

                if (rolltext.length > 1000) rolltext = total.toString();

                say(ray, msg.channel, rolltext);

                break;
            case "guild":
            case "guilds":
                let guilds = ["Krystal", "Sadie", "Ray", "Eli"];
                let guilds_compare = guilds.map((g) => g.toLowerCase());
                let authorGuild = await (await database.child(`guild/${msg.author.id}`).once("value")).val();
                if ((!options[1] && !authorGuild) || (options[1] && options[1].toLowerCase() == "available")) {
                    say(eli, msg.channel, `The available guilds are: ${guilds.join(", ")}!`);
                    return;
                }

                if (!options[1] || (options[1] && options[1] == "ranking")) {
                    let restext = "";
                    let ranking: { [guild: string]: number } = await (await database.child(`guilds/${msg.guildId}`).once("value")).val();
                    Object.entries(ranking).forEach((e) => {
                        restext += `${e[0]}: ${e[1]}\n`;
                    });
                    say(eli, msg.channel, restext);
                    return;
                }

                if (guilds_compare.includes(options[1].toLowerCase())) {
                    database.child(`guild/${msg.author.id}`).set(options[1].toLowerCase());
                    say(eli, msg.channel, `<@${msg.author.id}> joined ${options[1]} \'s guild!'`);
                    return;
                }
                break;
            case "play":
            case "play_button":
            case "play_list":
                let bot_name;

                let list = options[0] == "!play_list" ? true : false;
                if (options[1] && rps_bots.includes(options[1].toLowerCase())) {
                    bot_name = options[1].toLowerCase();
                    playrps(bot_name, msg.author.id, msg.channel, list);
                    return;
                }

                let components: MessageActionRow[] = [];
                if (!list) {
                    rps_bots.forEach((bot) => {
                        if (components.length == 0 || components[components.length - 1].components.length == 5)
                            components.push(new MessageActionRow());

                        components[components.length - 1].addComponents(
                            new MessageButton()
                                .setCustomId(`play-against=${bot}&id=${msg.author.id}&list=0`)
                                .setLabel(bot.toUpperCase())
                                .setStyle("SECONDARY")
                                .setEmoji(rps_bots_emojis[bot])
                        );
                    });
                } else {
                    components.push(
                        new MessageActionRow().addComponents(
                            new MessageSelectMenu()
                                .addOptions(
                                    // { label, value, description, default, emoji}
                                    rps_bots.map((bot) => ({
                                        label: bot.toUpperCase(),
                                        value: `play-against=${bot}&id=${msg.author.id}&list=1}`,
                                        description: bot == "random" ? `Play against a random character` : `Play against ${bot}`,
                                        emoji: rps_bots_emojis[bot],
                                    }))
                                )
                                .setCustomId("play-against-list")
                                .setPlaceholder("Choose")
                        )
                    );
                }

                msg.channel.send({
                    content: "Who do you want to play against?",
                    components: components,
                });

                break;
            case "rank":
                if (!msg.guild) return;
                let ray_channel = await ray.channels.fetch(msg.channel.id);
                if (!ray_channel?.isText()) return;
                ray_channel.sendTyping();
                let player_filter = msg.mentions.members?.first()?.id;
                say(
                    ray,
                    ray_channel,
                    await get_rank_message(
                        msg.guild,
                        msg.author.id,
                        await (await database.child("lvl/" + msg.guild.id).once("value")).val(),
                        0,
                        player_filter
                    )
                );
                break;
            case "mana": {
                let { level, maxMana, prestige, regen, timestamp, value } = await getMana(msg, msg.mentions.users.first());
                msg.reply(`Level: ${level}\nPrestige: ${prestige}\nMana: ${Math.floor(value)}/${maxMana}\nRegen: ${regen * 60}/m`);
                break;
            }
            case "summon":
                summon(msg, options);
                break;
            case "activity":
                if (msg.author.id != marineId) return;
                let acts: { [bot: string]: CustomActivity[] } = {
                    krystal: krystal_activities,
                    sadie: sadie_activities,
                    eli: eli_activities,
                    ray: ray_activities,
                };
                if (!acts[options[1]]) return;
                let act =
                    options[2] && parseInt(options[2]) < acts[options[1]].length
                        ? acts[options[1]][parseInt(options[2])]
                        : random_from_array(acts[options[1]]);
                changeActivity(...act);
                break;

            case "summoned":
            case "summons":
                {
                    let target = msg.mentions.members?.first() || msg.member;
                    let text = "";
                    let summoned = (await database.child("summons/" + msg.guild?.id + "/" + target.id).once("value")).val() || {};
                    let summoned_birds: { bird_id: number } =
                        (await database.child("birdpedia/" + msg.guild?.id + "/" + target.id).once("value")).val() || {};
                    let summoned_players: number[] = summoned && "player" in summoned ? Object.values(summoned["player"]) || [] : [];
                    let summoned_mods: number[] = summoned && "mod" in summoned ? Object.values(summoned["mod"]) || [] : [];
                    let birds = 0;
                    let players = 0;
                    let mods = 0;
                    Object.values(summoned_birds).forEach((bird) => (birds += bird));
                    summoned_players.forEach((player) => (players += player));
                    summoned_mods.forEach((mod) => (mods += mod));
                    text += get_summon_message("Was denied", summoned[SUMMON_NAMES.NO], "time");
                    text += get_summon_message("Was reached to talk about their car's extended warranty", summoned[SUMMON_NAMES.WARRANTY], "time");
                    text += get_summon_message("Performed", summoned[SUMMON_NAMES.CALL_THAT_A_RITUAL], "shitty ritual");
                    text += get_summon_message("Failed miserably", summoned[SUMMON_NAMES.FAIL_MISERABLY], "time");
                    text += get_summon_message("Was denied", summoned[SUMMON_NAMES.DENIED], "time");
                    text += get_summon_message("Summoned", summoned[SUMMON_NAMES.CHAIR], "chair");
                    text += get_summon_message("Heard", summoned[SUMMON_NAMES.CRICKETS], "cricket");
                    text += get_summon_message("Wasn't heard", summoned[SUMMON_NAMES.UNHEARD], "time");
                    text += get_summon_message("Summoned", summoned[SUMMON_NAMES.VOIDFISH], "voidfish", "voidfish");
                    text += get_summon_message("Summoned", summoned[SUMMON_NAMES.PLANE], "plane");
                    text += get_summon_message("Summoned", (summoned[SUMMON_NAMES.NOT_A_DODO] || 0) + birds, "regular bird");
                    text += get_summon_message("Summoned", summoned[SUMMON_NAMES.LITERAL_DODO], "dodo");
                    text += get_summon_message("Stepped on", summoned[SUMMON_NAMES.LEGO], "poisoned lego");
                    text += get_summon_message("Summoned Ray", summoned[SUMMON_NAMES.RAY], "time");
                    text += get_summon_message("Summoned Krystal", summoned[SUMMON_NAMES.KRYSTAL], "time");
                    text += get_summon_message("Summoned Sadie", summoned[SUMMON_NAMES.SADIE], "time");
                    text += get_summon_message("Summoned Eli", summoned[SUMMON_NAMES.ELI], "time");
                    text += get_summon_message("Summoned Dodo", summoned[SUMMON_NAMES.DODO], "time");
                    text += get_summon_message("Summoned", players, "player");
                    text += get_summon_message("Summoned", mods, "moderator");
                    say(
                        ray,
                        msg.channel,
                        text == "" ? `${target.displayName} hasn't summoned anything yet` : `${target.displayName}\n\`\`\`\n` + text + "```"
                    );
                }
                break;
            case "claim":
                {
                    let level = (await database.child(`level/${msg.guildId}/${msg.author.id}`).once("value")).val();
                    let summoned_birds = Object.keys(
                        (await database.child(`birdpedia/${msg.guildId}/${msg.author.id}`).once("value")).val() || {}
                    ).map((a) => parseInt(a));
                    let prestige = (await database.child(`prestige/${msg.guildId}/${msg.author.id}`).once("value")).val();
                    let supposed_to_have = 10 + 5 * prestige + prestige * level;
                    let card_db = database.child(`card_dojo/cards/${msg.guildId}/${msg.author.id}`);
                    let cards = (await card_db.once("value")).val() || [];
                    if (cards.length >= supposed_to_have) {
                        say(ray, msg.channel, "You have no birds to claim");
                        return;
                    }
                    let birds = get_birds().length;
                    let claimed = supposed_to_have - cards.length;
                    while (cards.length < supposed_to_have) {
                        let card = Math.floor(Math.random() * birds);
                        if (cards.includes(card) || summoned_birds.includes(card)) continue;
                        cards.push(card);
                    }
                    card_db.set(cards);
                    say(ray, msg.channel, `Claimed ${claimed} birds`);
                }
                break;
            case "ninja":
                say(ray, msg.channel, {
                    content: `${msg.member.displayName} wants to play bird-jitsu`,
                    components: [
                        new MessageActionRow().addComponents(
                            new MessageButton()
                                .setLabel("Accept")
                                .setStyle("SUCCESS")
                                .setCustomId("bj-start?id=" + msg.author.id)
                        ),
                    ],
                });
                break;
            case "restart": {
                if (![marineId, dodoId].includes(msg.author.id)) {
                    let channel = await krystal.channels.fetch(msg.channel.id);
                    if (!(channel instanceof TextChannel)) return;
                    channel.sendTyping();
                    killing(msg, msg.author, undefined, "That's not a command");
                    break;
                }
                restart(msg);
                break;
            }
            case "calculator": {
                new Calculator(msg, options[1] == "public");
                break;
            }
            case "botchannel": {
                if (!msg.member.permissions.has("CREATE_PUBLIC_THREADS")) {
                    say(d20, msg.channel, "You don't have the permission to use that command");
                    return;
                }

                if (!options[1]) {
                    say(d20, msg.channel, "The thread needs a name");
                    return;
                }

                if (msg.channel instanceof TextChannel) {
                    msg.channel.threads
                        .create({
                            name: options[1],
                        })
                        .then((thread) => {
                            [krystal, ray, eli, sadie].forEach((bot) => {
                                bot.channels.fetch(msg.channel.id).then((channel) => {
                                    if (channel instanceof TextChannel)
                                        channel.threads.fetch(thread.id).then((t) => {
                                            t?.join().then((th) => {
                                                th.send("Hello");
                                            });
                                        });
                                });
                            });
                        });
                }
            }
            // case "help": {
            //     new Help(msg);
            //     break;
            // }

            case "colors": {
                if (msg.author.id != marineId) return;

                let components = [];
                for (let [name, color, roleId, emoji, necessaryIds] of colors) {
                    if (!components[components.length - 1] || components[components.length - 1]?.components.length >= 5)
                        components.push(new MessageActionRow());
                    components[components.length - 1]?.addComponents(
                        new MessageButton()
                            .setLabel(name)
                            .setStyle("PRIMARY")
                            .setEmoji(emoji)
                            .setCustomId(`colors?id=${roleId}&necessary=${necessaryIds.join(",")}`)
                    );
                }
                say(krystal, options[1], {
                    content: "What color do you want your name to be displayed as? (You need to have the role that corresponds to that color)",
                    components,
                });
                break;
            }

            case "harem": {
                say(d20, msg.channel, "That command has been temporary removed");
                break;
                // let harem = await Harem.get(msg.guildId, msg.author.id);

                // try {
                //     switch (options[1]) {
                //         case "create": {
                //             if (harem?.ownsOne) throw "You already have a harem";
                //             harem.create();
                //             say(eli, msg.channel, `${msg.author} just created a harem!!!`, undefined, { messageReference: msg });
                //             break;
                //         }

                //         case "disband": {
                //             if (!harem?.ownsOne) throw "You don't have a harem to disband";
                //             harem.disband();
                //             say(eli, msg.channel, `${msg.author} disbanded their harem!!!`, undefined, { messageReference: msg });
                //             break;
                //         }

                //         case "invite":
                //             {
                //                 if (!harem?.ownsOne) throw 'You don\'t have a harem yet\nCreate one by using "harem create"';
                //                 if (!msg.mentions.members?.first()) throw "You need to mention someone";
                //                 if (msg.mentions.members.first()?.id == msg.author.id) throw "You can't join your own harem";
                //                 if (harem.includes(msg.mentions.members.first()!.id))
                //                     throw `${msg.mentions.members.first()?.displayName} is already in your harem`;
                //                 if (harem.isBanned(msg.mentions.members.first()!.id))
                //                     throw "That player is banned from your harem (use 'harem unban @')";

                //                 say(
                //                     eli,
                //                     msg.channel,
                //                     {
                //                         content: `${userMention(msg.mentions.members.first()!.id)}, ${msg.author} invited you to their harem`,
                //                         components: [
                //                             new MessageActionRow().addComponents(
                //                                 new MessageButton()
                //                                     .setCustomId(
                //                                         `harem?command=accept_invite&invited_id=${msg.mentions.members.first()?.id}&harem_id=${
                //                                             msg.author.id
                //                                         }`
                //                                     )
                //                                     .setLabel("ACCEPT")
                //                                     .setStyle("SUCCESS"),
                //                                 new MessageButton()
                //                                     .setCustomId(
                //                                         `harem?command=reject_invite&invited_id=${msg.mentions.members.first()?.id}&harem_id=${
                //                                             msg.author.id
                //                                         }`
                //                                     )
                //                                     .setLabel("REJECT")
                //                                     .setStyle("DANGER")
                //                             ),
                //                         ],
                //                     },
                //                     undefined,
                //                     { messageReference: msg }
                //                 );
                //             }
                //             break;

                //         case "open": {
                //             if (!harem.ownsOne) throw "You don't have a harem";
                //             harem.isOpen = true;
                //             say(eli, msg.channel, await harem.getOpenMessage(msg), undefined, { messageReference: msg });
                //             break;
                //         }

                //         case "join": {
                //             if (!options[2] && !msg.mentions.members?.first()) throw 'Use "harem join @" or "harem join <id>"';
                //             let id = msg.mentions.members?.first()?.id || options[2];
                //             if (id == msg.author.id) throw "You can't join your own harem";
                //             if (harem.isIn(id)) throw "You are already in that player's harem";
                //             let joining = await Harem.get(msg.guildId, id);
                //             if (!joining.isOpen) throw userMention(id) + "'s harem is not open";
                //             if (joining.isBanned(msg.author.id)) throw "You are banned from that harem";
                //             harem.join(id);
                //             say(eli, msg.channel, `${msg.author} joined ${userMention(id) + "'s harem"}!!!`, undefined, {
                //                 messageReference: msg,
                //             });
                //             break;
                //         }

                //         case "ban":
                //         case "block": {
                //             if (!harem.ownsOne) throw "You don't have a harem";
                //             if (!options[2] && !msg.mentions.members?.first())
                //                 throw 'Use "harem ' + options[1] + ' @" or "harem ' + options[1] + ' <id>"';
                //             let id = msg.mentions.members?.first()?.id || options[2];
                //             harem.kick(id);
                //             if (harem.isBanned(id)) throw "That player is already banned";
                //             harem.ban(id);
                //             say(eli, msg.channel, `Banned ${userMention(id)} from ${msg.author}'s harem!!!`, undefined, {
                //                 messageReference: msg,
                //             });
                //             break;
                //         }
                //         case "unban":
                //         case "unblock": {
                //             if (!harem.ownsOne) throw "You don't have a harem";
                //             if (!options[2] && !msg.mentions.members?.first())
                //                 throw 'Use "harem ' + options[1] + ' @" or "harem ' + options[1] + ' <id>"';
                //             let id = msg.mentions.members?.first()?.id || options[2];
                //             if (!harem.isBanned(id)) throw "That player is not banned";
                //             harem.unban(id);
                //             say(eli, msg.channel, `Unbanned ${userMention(id)} from ${msg.author}'s harem!!!`, undefined, {
                //                 messageReference: msg,
                //             });
                //             break;
                //         }

                //         case "list": {
                //             switch (options[2]) {
                //                 case "open":
                //                     say(eli, msg.channel, await Harem.GetOpenHarems(msg.guild!.id));
                //                     break;
                //                 default:
                //                     say(eli, msg.channel, await Harem.GetHarems(msg.guild!.id));
                //                     break;
                //             }
                //             break;
                //         }

                //         case "close": {
                //             if (!harem.ownsOne) throw "You don't have a harem";
                //             if (!harem.isOpen) throw "Your harem is already closed";
                //             harem.isOpen = false;
                //             say(eli, msg.channel, `${userMention(msg.author.id)} closed their harem`, undefined, { messageReference: msg });
                //             break;
                //         }

                //         case "leave": {
                //             if (!options[2] && !msg.mentions.members?.first()) throw 'Use "harem leave all", "harem leave @" or "harem leave <id>"';
                //             let id = msg.mentions.members?.first()?.id || options[2];
                //             if (id != "all" && !harem.isIn(id)) throw "You aren't in that player's harem";
                //             harem.leave(id);
                //             say(eli, msg.channel, `${msg.author} left ${id == "all" ? "all harems" : userMention(id) + "'s harem"}!!!`, undefined, {
                //                 messageReference: msg,
                //             });
                //             break;
                //         }

                //         case "kick": {
                //             if (!msg.mentions.members?.first() && !options[1]) throw 'Use "!harem kick @" or "!harem kick <id>"';
                //             let id = msg.mentions.members?.first()?.id || options[1];
                //             if (!harem.includes(id)) throw "Selected user is not a part of your harem";
                //             harem.kick(id);
                //             break;
                //         }

                //         default:
                //             say(eli, msg.channel, await harem.getMembersMessage(msg), undefined, {
                //                 messageReference: msg,
                //             });
                //             break;
                //     }
                // } catch (err) {
                //     if (typeof err == "string") say(eli, msg.channel, err, undefined, { messageReference: msg });
                //     else console.error(err);
                //     return;
                // }
                // break;
            }

            case "stats": {
                let rolls: number[][] = [];
                let stats: string[] = [];

                for (let i = 0; i < 6; i++) {
                    rolls[i] = [];
                    for (let e = 0; e < 4; e++) rolls[i][e] = Math.floor(Math.random() * 6) + 1;
                }

                for (const i in rolls) {
                    let roll = rolls[i];
                    let lowest = 0;
                    roll.forEach((r, e) => {
                        if (r < roll[lowest]) lowest = e;
                    });
                    let sum = roll.reduce((a, b) => a + b);
                    stats[i] = `${["str", "dex", "con", "wis", "int", "cha"][i]} ${sum - roll[lowest]}    (${roll
                        .map((r, i) => (i == lowest ? `~~${r}~~` : r))
                        .join(", ")})`;
                }

                msg.reply(stats.join("\n"));

                break;
            }

            // case "harems": {
            //     say(eli, msg.channel, {
            //         components: [
            //             new MessageActionRow().addComponents(
            //                 new MessageButton()
            //                     .setURL(`https://www.cyanmarine.net/tc/harem/${msg.guildId}`)
            //                     .setStyle("LINK")
            //                     .setEmoji(getCharacterEmoji())
            //                     .setLabel(`All harems of ${msg.guild?.name ?? "this server"}`)
            //             ),
            //         ],
            //     });
            //     break;
            // }

            // case "test": {
            //     if (msg.author.id != marineId) return;
            //     let embed = new MessageEmbed()
            //         .setAuthor({
            //             name: "Test",
            //             iconURL: "https://cdn.discordapp.com/avatars/305883924310261760/af928f5799ff344d1b42cdc74cd14d68.webp?size=1024",
            //             url: "https://www.cyanmarine.net/",
            //         })
            //         .setDescription("This is a test")
            //         .setColor("#00ff00")
            //         .setFooter({
            //             iconURL: "https://cdn.discordapp.com/avatars/305883924310261760/af928f5799ff344d1b42cdc74cd14d68.webp?size=1024",
            //             text: "Cyanmarine",
            //         })
            //         .setThumbnail("https://cdn.discordapp.com/avatars/305883924310261760/af928f5799ff344d1b42cdc74cd14d68.webp?size=1024")
            //         .setTimestamp(new Date())
            //         .setURL("https://cyanmarine.net/")
            //         .setTitle("Test")
            //         .setImage("https://cdn.discordapp.com/avatars/305883924310261760/af928f5799ff344d1b42cdc74cd14d68.webp?size=1024")
            //         .addField("FIELD", "THIS IS AN INLINE FIELD", true)
            //         .addField("FIELD", "THIS IS AN INLINE FIELD", true)
            //         .addField("FIELD", "THIS IS NOT AN INLINE FIELD", false)
            //         .addField("FIELD", "THIS IS NOT AN INLINE FIELD", false)
            //         .addField("Test", "This is a test")
            //         .addField("Something", "Something");

            //     msg.reply({ embeds: [embed] });
            //     break;
            // }

            case "test": {
                let img = await createCharacterCard(
                    msg,
                    "character",
                    msg.member.displayAvatarURL({ format: "png", size: 1024 }),
                    ["Archery", "Earth", "Dark"],
                    9999,
                    99
                );
                if (img) msg.reply({ files: [img] });
                break;
            }

            case "isekai": {
                if (!msg.member.permissions.has("MANAGE_MESSAGES")) {
                    say(d20, msg.channel, "You don't have the permission to use this command");
                    return;
                }

                if (!msg.attachments.first()) {
                    say(d20, msg.channel, "You need to attach a file to this command");
                    return;
                }
                if (msg.attachments.first()!.contentType != "text/plain; charset=utf-8") {
                    say(d20, msg.channel, "Incorrect file format");
                    return;
                }
                let url = msg.attachments.first()!.url;
                let text: string = (await axios.get(url)).data;

                let match = text
                    .split("# ")
                    .map((a) => a.match(/\<(?<character>[A-Z0-9]+)\> (?<typing>[0-9]+) ?(?<delay>[0-9]+)?[\n\r]{1,2}(?<content>[\w\W]+)/i));

                match.shift();

                let channel_id = msg.mentions.channels.first()?.id ?? msg.channel.id;

                let channels: { [character: string]: Promise<AnyChannel | null> } = {
                    d20: d20.channels.fetch(channel_id),
                    eli: eli.channels.fetch(channel_id),
                    sadie: sadie.channels.fetch(channel_id),
                    krystal: krystal.channels.fetch(channel_id),
                    ray: ray.channels.fetch(channel_id),
                    cerby: cerby.channels.fetch(channel_id),
                };

                let nextLine = (i: number): Promise<void> =>
                    new Promise(async (resolve) => {
                        let next = async () => {
                            if (i < match.length - 1) await nextLine(i + 1);
                            resolve();
                        };
                        let current = match[i];
                        if (
                            !current ||
                            !current.groups ||
                            !("character" in current.groups) ||
                            !("typing" in current.groups) ||
                            !("content" in current.groups)
                        ) {
                            next();
                            return;
                        }
                        let { character, delay = null, typing, content } = current.groups;
                        let channel = await channels[character.toLowerCase()];
                        if (channel && channel instanceof TextChannel) {
                            if (delay) await wait(parseInt(delay));
                            await channel.sendTyping();
                            await wait(parseInt(typing ?? "0"));
                            if (content) await channel.send(await detectEmoji(content, channel));
                            next();
                        }
                    });
                nextLine(0);
                // # \<[A-Z]+\> [0-9]+[\n\r]{1,2}[^#]+
                // say(d20, msg.channel, text);
            }
            case "toggleroles": {
                // console.log(options);
                if (msg.author.id != marineId) return;
                // console.log(options);
                let channelId = options[1];
                // let messageId = options[2];

                let channel = await krystal.channels.fetch(channelId);
                if (!channel?.isText()) return;
                // let message = await channel.messages.fetch(messageId);

                channel.send({
                    components: [
                        new MessageActionRow().addComponents([
                            new MessageButton()
                                .setEmoji("<:GMBelleNotification:724792043880055094>")
                                .setCustomId("gamemastersfanrole")
                                .setLabel("Game masters")
                                .setStyle("PRIMARY"),
                            new MessageButton()
                                .setEmoji("<:GTHariAnnoyed:1000039329621618799>")
                                .setCustomId("geminitwilightfanrole")
                                .setLabel("Gemini twilight")
                                .setStyle("PRIMARY"),
                        ]),
                    ],
                    content:
                        "To get a free Role that notifies you when there are new episodes or announcements, please click on one of the buttons bellow\nIf you already have a role and want to remove it, click on the button again",
                });
                break;
            }
            case "rules": {
                if (![marineId].includes(msg.author.id)) return;
                //                 let messages = [
                //                     [
                //                         sadie,
                //                         `- **<:GMSadieExcited:566414391193370638> - Be Polite & Civil**
                // Don't insult or name call anyone in mean spirit - Sarcasm can be accepted in some situations.
                // No arguments either, Though civil and sophisticated bouts like "Who's best waifu" are fine.`,
                //                     ],
                //                     [
                //                         eli,
                //                         `- **<:GMEliAngry:1001202159049773066> - No racism, sexism or any form of hate speech**
                // Everyone should feel welcome, No matter their skin color, religion, height or weight.
                // We accept everyone here, So long as they follow the rules.`,
                //                     ],
                //                     [
                //                         ray,
                //                         `- **<:GMRayUninterested:1098064201689333922> - Don't spam**
                // If you're taking up most of the screen with just your messages or posts, You're probably spamming. Sending an image or two in a row is fine, But don't overdo it either.
                // We understand we have the best emoji's ever created, So spamming those in appropriate or hype moments is A-Okay!
                // <:GMEliPopcorn3:1005611420274143283> <:GMEliPopcorn3:1005611420274143283> <:GMEliPopcorn3:1005611420274143283> <:GMEliPopcorn3:1005611420274143283> <:GMEliPopcorn3:1005611420274143283> <:GMEliPopcorn3:1005611420274143283> <:GMEliPopcorn3:1005611420274143283> <:GMEliPopcorn3:1005611420274143283> <:GMEliPopcorn3:1005611420274143283>
                // <:GMEliPopcorn2:1001202163621581031> <:GMEliPopcorn2:1001202163621581031> <:GMEliPopcorn2:1001202163621581031> <:GMEliPopcorn2:1001202163621581031> <:GMEliPopcorn2:1001202163621581031> <:GMEliPopcorn2:1001202163621581031> <:GMEliPopcorn2:1001202163621581031> <:GMEliPopcorn2:1001202163621581031> <:GMEliPopcorn2:1001202163621581031>
                // <:GMEliPopcorn1:1000039316728328286> <:GMEliPopcorn1:1000039316728328286> <:GMEliPopcorn1:1000039316728328286> <:GMEliPopcorn1:1000039316728328286> <:GMEliPopcorn1:1000039316728328286> <:GMEliPopcorn1:1000039316728328286> <:GMEliPopcorn1:1000039316728328286> <:GMEliPopcorn1:1000039316728328286> <:GMEliPopcorn1:1000039316728328286>`,
                //                     ],
                //                     [
                //                         krystal,
                //                         `- **<:GMKrystalDevious:621756101070946305> - No talk of Politics or Religion**
                // While we accept everyone here, We also believe in keeping more sensitive opinions and topics to yourself as to avoid any possible arguments.`,
                //                     ],
                //                     [
                //                         cerby,
                //                         `- **<:GMCerberusSmile:1001202151340654622> - Keep it (Mostly) clean**
                // We have users of all ages in our community, So don't post any messages, images or links that shouldn't be viewed by our younger ones. Cursing is fine in moderation, It's not like if they haven't heard their parents say naughty words before.`,
                //                     ],
                //                     [
                //                         d20,
                //                         `- **<:GTAngelNervous:1000039352908398602> - Stay on topic**
                // All Fan Art not related to Trivium Comics and links to other Discord servers can be posted in the ⁠general channel, But not to any of the other channels.`,
                //                     ],
                //                 ] as [Client, string][];
                //                 let channel = options[1];
                //                 // krystal.channels
                //                 //     .fetch(channel)
                //                 //     .then(async (channel) => {
                //                 // if (!channel?.isText()) return console.error("Channel " + channel + " is not a text channel");
                //                 for (const [bot, message] of messages) {
                //                     let channel = await bot.channels.fetch(options[1]);
                //                     if (!channel?.isText()) continue;
                //                     await channel.send(message);
                //                 }
                //                 await say(
                //                     ray,
                //                     options[1],
                //                     {
                //                         components: [
                //                             new MessageActionRow().addComponents([
                //                                 new MessageButton()
                //                                     .setEmoji("<:GMBelleNotification:724792043880055094>")
                //                                     .setCustomId("gamemastersfanrole")
                //                                     .setLabel("Game masters")
                //                                     .setStyle("PRIMARY"),
                //                                 new MessageButton()
                //                                     .setEmoji("<:GTHariAnnoyed:1000039329621618799>")
                //                                     .setCustomId("geminitwilightfanrole")
                //                                     .setLabel("Gemini twilight")
                //                                     .setStyle("PRIMARY"),
                //                             ]),
                //                         ],
                //                         content:
                //                             "To get a free Role that notifies you when there are new episodes or announcements, please click on one of the buttons bellow\nIf you already have a role and want to remove it, click on the button again",
                //                     },
                //                     0
                //                 );

                //                 let components = [];
                //                 for (let [name, color, roleId, emoji, necessaryIds] of colors) {
                //                     if (!components[components.length - 1] || components[components.length - 1]?.components.length >= 5)
                //                         components.push(new MessageActionRow());
                //                     components[components.length - 1]?.addComponents(
                //                         new MessageButton()
                //                             .setLabel(name)
                //                             .setStyle("PRIMARY")
                //                             .setEmoji(emoji)
                //                             .setCustomId(`colors?id=${roleId}&necessary=${necessaryIds.join(",")}`)
                //                     );
                //                 }
                //                 await say(
                //                     krystal,
                //                     options[1],
                //                     {
                //                         content: "What color do you want your name to be displayed as? (You need to have the role that corresponds to that color)",
                //                         components,
                //                     },
                //                     0
                //                 );
                //                 // })
                //                 // .catch(console.error);
                //                 // say(krystal, channel, message).catch((e) => console.log(e));
                //                 break;
            }
            // case "rotate": {
            //     break;
            // }
            case "notification": {
                if (![marineId, dodoId].includes(msg.author.id)) {
                    return;
                    //say(d20, msg.channel, "You don't have permission to use that command");
                }
                notificationCult(msg.channel.id);
                break;
            }
            case "update": {
                if (![marineId, dodoId].includes(msg.author.id)) {
                    say(d20, msg.channel, "You don't have permission to use that command");
                    break;
                }
                update(msg);
                break;
            }
            case "gitpull": {
                if (![marineId, dodoId].includes(msg.author.id)) {
                    say(d20, msg.channel, "You don't have permission to use that command");
                    break;
                }
                gitpull(msg);
                break;
            }
            case "warnings": {
                let player = msg.mentions.members?.first();
                if (!player || !(player instanceof GuildMember)) {
                    say(d20, msg.channel, "Something went wrong", undefined, { messageReference: msg });
                    return;
                }
                let warnings = (await (await database.child(`warnings/${msg.guildId}/${player.id}`).once("value")).val()) ?? [];
                // if (!warnings || typeof warnings != "object") warnings = {};
                if (!Array.isArray(warnings)) warnings = Object.values(warnings);
                let text = `${player.user.username} has ${warnings.length} warnings`;
                if (warnings.length > 0) {
                    text += "```";
                    for (let w in warnings) text += `\n${parseInt(w) + 1}: ${warnings[parseInt(w)]}`;
                    text += "```";
                }
                say(d20, msg.channel, text, undefined, { messageReference: msg });
                break;
            }
            case "control":
                {
                    if (![marineId].includes(msg.author.id)) return;
                    let components = [] as (MessageActionRow | (Required<BaseMessageComponentOptions> & MessageActionRowOptions))[];
                    components.push(
                        new MessageActionRow().addComponents([
                            new MessageButton().setCustomId("stop").setLabel("STOP").setStyle("PRIMARY"),
                            new MessageButton().setCustomId("restart").setLabel("RESTART").setStyle("PRIMARY"),
                            new MessageButton().setCustomId("update").setLabel("UPDATE").setStyle("PRIMARY"),
                            new MessageButton().setCustomId("gitpull").setLabel("PULL").setStyle("PRIMARY"),
                        ])
                    );
                    say(krystal, msg.channel, { components });
                }
                break;
            case "delete_all": {
                if (![marineId].includes(msg.author.id) || !["1164622025969639565"].includes(msg.channel.id)) return;
                console.log("Deleting all messages on channel");
                let messages: [string, Message][];
                do {
                    messages = Array.from(await msg.channel.messages.fetch());
                    if (messages.length <= 0) break;
                    for (let i = 0; i < messages.length; i++) {
                        await messages[i][1].delete();
                        if (i != 0 && i % 5 == 0) await wait(5000);
                    }
                } while (true);
                console.log("Deleted all messages on channel");

                break;
            }
            default:
                for (let { names, callback } of _commands) {
                    // console.log(command, names);
                    if (names.includes(command)) {
                        // await msg.channel.sendTyping();
                        callback(msg, options);
                        break;
                    }
                }
                break;
        }
    }
});

const get_summon_message = (action: string, times: number = 0, result?: string, plural?: string) =>
    times == 0 ? "" : action + " " + times + " " + (plural ? (times == 1 ? result : plural) : result + (result && times == 1 ? "" : "s")) + "\n";

krystal.on("guildMemberAdd", async (member: GuildMember) => {
    if (testing && member.guild.id != testGuildId) return;
    // console.log(`${member.user.username} joined ${member.guild.name}\nDefault channel: ${member.guild.systemChannelId}`);
    if (!member.guild.systemChannel) return;
    let channel = testing ? testChannelId : member.guild.systemChannel;
    await welcome_functions[Math.floor(Math.random() * welcome_functions.length)](member, channel);
    if (member.guild.id == triviumGuildId)
        await say(krystal, channel, `Get a free Role for reading the ${channelMention("1048619197518848121")} channel!`);
});
const welcome_functions = [
    (member: GuildMember, channel: TextChannel | string): Promise<Message> =>
        new Promise(async (resolve, reject) => {
            say(krystal, channel, `Welcome to the game of life, ${userMention(member.id)}!`)
                .then(resolve)
                .catch(reject);
        }),
    (member: GuildMember, channel: TextChannel | string): Promise<Message> =>
        new Promise(async (resolve, reject) => {
            await say(krystal, channel, {
                content: `I would welcome you, ${userMention(member.id)}, but I\'m currently a lamp and lamps do not talk.`,
                files: [lamp],
            })
                .then(resolve)
                .catch(reject);
        }),
    (member: GuildMember, channel: TextChannel | string): Promise<Message> =>
        new Promise(async (resolve, reject) => {
            say(
                krystal,
                channel,
                `Greetings, ${userMention(
                    member.id
                )}! \nRay told me to tell you that I'm his girlfriend, so don't try anything. \nThen Sadie told me to tell you to tell you that I'm not Ray's girlfriend. \nThen Eli told me they are both wrong and that I'm his girlfriend. \nThey're still arguing, so I still don't know who's girfriend I am.`
            )
                .then(resolve)
                .catch(reject);
        }),
    (member: GuildMember, channel: TextChannel | string): Promise<Message> =>
        new Promise(async (resolve, reject) => {
            say(krystal, channel, {
                content: `Welcome, ${userMention(member.id)}!\nNow that you are properly greeted, I will return to the clothes pile.`,
                files: [sleep],
            })
                .then(resolve)
                .catch(reject);
        }),
    (member: GuildMember, channel: TextChannel | string): Promise<Message> =>
        new Promise(async (resolve, reject) => {
            say(krystal, channel, `Welcome, ${userMention(member.id)}!\nIf I had what you call "emotions", I would be happy that you're here`)
                .then(resolve)
                .catch(reject);
        }),
    (member: GuildMember, channel: TextChannel | string): Promise<Message> =>
        new Promise(async (resolve, reject) => {
            say(krystal, channel, `Konnichiwa, ${userMention(member.id)}-Chan (◕ᴗ◕✿)`)
                .then(resolve)
                .catch(reject);
        }),
    (member: GuildMember, channel: TextChannel | string): Promise<Message> =>
        new Promise(async (resolve, reject) => {
            say(
                krystal,
                channel,
                `For some reason the residence of this place keep on saying something like \"I would tell you to grab a chair, but we can\'t afford those\" when new people join. \nI don\'t really know what that means, but welcome anyways, ${userMention(
                    member.id
                )}.`
            )
                .then(resolve)
                .catch(reject);
        }),
    (member: GuildMember, channel: TextChannel | string): Promise<Message> =>
        new Promise(async (resolve, reject) => {
            say(krystal, channel, `Welcome, to what the residents of this place call \"Hell\", ${userMention(member.id)}. Hope you like it in here`)
                .then(resolve)
                .catch(reject);
        }),
    (member: GuildMember, channel: TextChannel | string): Promise<Message> =>
        new Promise(async (resolve, reject) => {
            await say(ray, channel, `Hi, longshot133!`);
            await say(krystal, channel, `I think their name is ${userMention(member.id)}`);
            say(ray, channel, `You just don't get jokes, do you?`).then(resolve).catch(reject);
        }),
    (member: GuildMember, channel: TextChannel | string): Promise<Message> =>
        new Promise(async (resolve, reject) => {
            say(krystal, channel, {
                content: `Welcome, ${member}. I heard that you humans like popcorn, so here is some.`,
                files: [await eating(undefined, member.user)],
            })
                .then(resolve)
                .catch(reject);
        }),
];

d20.on("guildMemberRemove", (member) => {
    if (testing && member.guild.id != testGuildId) return;
    else if (!testing && member.guild.id == testGuildId) return;

    Harem.get(member.guild.id, member.id).then((harem) => {
        if (harem.isIn("any")) harem.leave("all");
        if (harem.ownsOne) harem.disband();
    });
});

export const cloneArray = <T>(array: T[] | Collection<any, T>) => (array as T[]).map((a) => a);

export async function asyncForEach<T>(
    array: T[],
    func: (value: T[], i: number) => Promise<void | any> | void | any,
    i = 0,
    resolve?: (value: void) => void,
    reject?: (reason?: any) => void
) {
    try {
        await func(array, i);
        if (i < array.length - 1)
            if (resolve)
                return new Promise<void>(async (resolve, reject) => {
                    await asyncForEach(array, func, i + 1, resolve, reject);
                });
            else await asyncForEach(array, func, i + 1, resolve, reject);
        else if (resolve) resolve();
        else return;
    } catch (err) {
        if (reject) reject(err);
        else throw err;
    }
}

export function asyncWhile(func: (...values: any[]) => Promise<boolean> | boolean) {
    return new Promise<void>(async (resolve, reject) => {
        try {
            const repeat = async () => {
                if (!(await func())) {
                    resolve();
                    return;
                }
                repeat();
            };
            repeat();
        } catch (err) {
            reject(err);
        }
    });
}

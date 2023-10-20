import { SlashCommandBuilder, formatEmoji, hyperlink, userMention } from "@discordjs/builders";
import { Canvas, CanvasRenderingContext2D, createCanvas, loadImage } from "canvas";
import {
    ActivityType,
    AllowedImageSize,
    ButtonInteraction,
    Client,
    CommandInteraction,
    Guild,
    GuildEmoji,
    GuildMember,
    HexColorString,
    InteractionReplyOptions,
    InteractionUpdateOptions,
    Message,
    MessageActionRow,
    MessageAttachment,
    MessageButton,
    MessageComponent,
    MessageEditOptions,
    MessageEmbed,
    MessageOptions,
    MessageSelectMenu,
    ModalSubmitInteraction,
    PartialMessage,
    PresenceStatusData,
    ReplyOptions,
    SelectMenuInteraction,
    TextBasedChannel,
    TextChannel,
    User,
} from "discord.js";
import { existsSync, lstatSync, readFileSync, readdir, readdirSync } from "fs";
import GIFEncoder from "gifencoder";
import { Readable } from "stream";
import { database, testing } from "..";
import assets from "../assetsIndexes";
import {
    ActivatorType,
    botData,
    BotDataTypes,
    BotNames,
    botNames,
    BotTypeNameToType,
    cerby,
    clients,
    CommandCondition,
    CommandType,
    CustomActivity,
    d20,
    DataVariable,
    eli,
    ImageType,
    isDataTypeKey,
    krystal,
    mod_alert_webhook,
    ray,
    sadie,
    setBotData,
    sieg,
    VariableType,
} from "../clients";
import { eli_activities } from "../eli/activities";
import { krystal_activities } from "../krystal/activities";
import { greet } from "../krystal/functions";
import { ray_activities } from "../ray/activities";
import { sadie_activities } from "../sadie/activities";
import { Harem } from "./harem";
import { disturb_channels, ignore_channels, isRestarting, setRestarting, testChannelId, triviumGuildId } from "./variables";
import { spawn } from "child_process";
import { CardStyle, createXpBar, defaultstyle, generatecard } from "../d20/functions";
import simpleGit from "simple-git";
import { parse } from "path";
import { addSlashCommand } from "../interactions/slash/common";

export const argClean = (args: string): string => args.replace(/\,|\.|\?|\!|\;|\:|\{|\}|\[|\]|\"|\'|\~|\^|\`|\´|\*|\’/g, "");
const createRegex = (test: string[]): RegExp => new RegExp(`(?<![A-Z0-9])(${test.join("|")})(?![A-Z0-9])`, "gi");

const argMatch = (args: string, test: string[]): RegExpMatchArray | null => argClean(args).match(createRegex(test));

export const testWord = (args: string, ...test: string[]): boolean => !!argMatch(args, test);

export function testAllWords(args: string, ...test: string[]): boolean {
    let res = argMatch(args, test);
    return !!res && res.length == test.length;
}

export const say = (
    bot: Client,
    channel: TextBasedChannel | string,
    content: string | MessageOptions,
    delay = 1000,
    reply?: ReplyOptions
): Promise<Message> =>
    new Promise(async (resolve, reject) => {
        // console.log(delay);
        delay = Math.max(1, delay);
        let id = typeof channel == "string" ? channel : channel.id;

        if (reply) {
            if (typeof content == "string") content = { content, reply };
            else content.reply = reply;
        }

        bot.channels
            .fetch(id)
            .then(async (c) => {
                if (c instanceof TextChannel) {
                    if (!bot.user) return;
                    let member = c.members.get(bot.user.id);
                    if (!member) return;
                    if (!c.permissionsFor(member).has("SEND_MESSAGES")) return;

                    if (typeof content == "string") content = await detectEmoji(content, c);
                    else if (content.content) content.content = await detectEmoji(content.content, c);

                    if (typeof content == "string") content = content.slice(0, 2000);
                    else if (content.content) content.content = content.content.slice(0, 2000);

                    c.sendTyping()
                        .then(() => {
                            setTimeout(() => {
                                c.send(content).then(resolve).catch(reject);
                            }, delay);
                        })
                        .catch(reject);
                }
            })
            .catch(reject);
    });

export function edit(msg: Message, content: string | MessageEditOptions, delay = 1000) {
    return new Promise(async (resolve, reject) => {
        delay = Math.max(1, delay);
        if (!(msg.channel instanceof TextChannel)) return reject("Not a text channel");

        if (typeof content == "string") content = await detectEmoji(content, msg.channel);
        else if (content.content) content.content = await detectEmoji(content.content, msg.channel);

        setTimeout(() => {
            msg.edit(content).then(resolve).catch(reject);
        }, delay);
    });
}

export function createEncoder(
    width: number,
    height: number,
    callback?: (buffer: Buffer) => void,
    options?: { delay?: number; repeat?: number; transparent?: number; quality?: number }
): { encoder: GIFEncoder; stream: Readable; canvas: Canvas; ctx: CanvasRenderingContext2D } {
    let encoder = new GIFEncoder(width, height);
    if (!options) options = {};
    if (!options.repeat) options.repeat = 0;
    if (!options.delay) options.delay = 1;
    if (!options.quality) options.quality = 10;
    if (!options.transparent) options.transparent = 0;
    encoder.start();
    encoder.setRepeat(options.repeat); // 0 for repeat, -1 for no-repeat
    encoder.setDelay(options.delay); // frame delay in ms
    encoder.setQuality(options.quality); // image quality. 10 is default.
    encoder.setTransparent(options.transparent);
    let stream = encoder.createReadStream();
    let buf: Uint8Array[] = [];
    stream.on("data", function (d) {
        buf.push(d);
    });
    stream.on("end", function () {
        let buffer = Buffer.concat(buf);
        if (callback) callback(buffer);
        stream.destroy();
    });
    let canvas = createCanvas(width, height);
    let ctx = canvas.getContext("2d");
    return { encoder, stream, canvas, ctx };
}

export function detectEmoji(content: string, channel: TextChannel) {
    return new Promise<string>((resolve) => {
        channel.guild.emojis.fetch().then((_e) => {
            let e = _e.map((e) => e).filter((e) => e.name);
            let emojis: { [emoji: string]: GuildEmoji } = {};
            for (const emoji of e) emojis[emoji.name!] = emoji;

            // let text_emojis = content.match(/<:[^:]+:[0-9]+>/gi);
            let text_emojis = content.match(/(?<=:)[^:]+(?=:)/gi);

            let changed: string[] = [];
            if (text_emojis)
                for (let emoji of text_emojis) {
                    if (changed.includes(emoji)) continue;
                    changed.push(emoji);
                    if (emojis[emoji]) {
                        let regexp = new RegExp(`:${emoji}:`, "gi");
                        content = content.replace(regexp, `${formatEmoji(emojis[emoji].id)}`);
                    }
                }
            return resolve(content);
        });
    });
}

export function getTarget(msg: Message): User | undefined {
    if (msg?.mentions.users.first()) return msg.mentions.users.first();
    if (testWord(msg.content, "me", "I", "Im", "my")) return msg.author;
    return undefined;
}

export function getTargetMember(msg: Message): GuildMember | undefined {
    if (msg.mentions.members?.first()) return msg.mentions.members?.first();
    if (testWord(msg.content, "me", "I", "Im", "my")) return msg.member || undefined;
    return undefined;
}

export function getMember(msg: Message): GuildMember | undefined {
    if (msg.mentions.members?.first()) return msg.mentions.members.first();
    if (msg.member && testWord(msg.content, "me", "I", "Im")) return msg.member;
    return undefined;
}

export function notificationCult(channel_id: string) {
    [krystal, sadie, ray, eli].forEach((bot) => {
        say(bot, channel_id, ":GMBelleNotification:").catch(console.error);
    });
}

export function changeActivity(
    bot_name: string,
    type: Exclude<ActivityType, "CUSTOM"> | undefined,
    text: string | undefined,
    avatar?: string | Buffer,
    name: string | undefined = text,
    nickname: string | null = null
) {
    let bot = clients[bot_name];
    // let status: "dnd" | "online" = random_from_array(["online", "online", "online", "dnd"]);
    // let status: "online" = "online";
    if (type && text) bot.user?.setPresence({ activities: [{ type, name: text }] });
    if (avatar)
        bot.user?.setAvatar(avatar).catch(() => {
            console.error(`Couldn\'t change ${bot.user?.username}\'s avatar'`);
        });
    bot.guilds.cache.forEach((guild) => {
        guild.me?.setNickname(nickname);
    });
    // console.log(bot.user?.username + ': ' + bot.user?.presence.status);
    database.child("activities/" + bot.user?.username).set(name);
}

export const msg2embed = (msg: Message | PartialMessage) => {
    let embed = new MessageEmbed()
        .setAuthor({ name: msg.author?.username || "UNKNOWN", iconURL: msg.author?.displayAvatarURL(), url: msg.url })
        .setTitle("Go to original")
        .setURL(msg.url)
        .setDescription(msg.content ?? "MISSING_CONTENT")
        .setTimestamp(msg.createdTimestamp)
        .setColor(msg.member?.displayHexColor || "WHITE");
    let img = msg.attachments.first()?.url;
    if (img) embed.setImage(img);
    let embeds = msg.embeds;
    embeds.unshift(embed);
    return embeds;
};

export const random_from_array = <Item>(array: Item[]): Item => array[Math.floor(Math.random() * array.length)];
export const capitalize = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1);
export const randomchance = (percentage: number = 10): boolean => Math.floor(Math.random() * 100) < percentage;

function clearAllData() {
    // console.log(botData);
    for (let bot of botNames) {
        for (let key in botData[bot].command) botData[bot].command[key] = clearCommand(botData[bot].command[key]);
        for (let key in botData[bot].variable)
            if (!(botData[bot].variable[key] instanceof DataVariable))
                botData[bot].variable[key] = new DataVariable(botData[bot].variable[key] as any);
        for (let key in botData[bot].activator) {
            botData[bot].activator[key] = clearActivator(botData[bot].activator[key]);
        }
    }
}

var defaultData: typeof botData | undefined = undefined;
export function readAllBotData() {
    return new Promise(async (resolve, reject) => {
        if (!defaultData) defaultData = botData;
        else setBotData(defaultData);

        for (let name of botNames) {
            try {
                console.log(await readData(name));
            } catch (err) {
                console.error(err);
            }
        }
        // console.log(JSON.stringify(botData, null, 4));
        clearAllData();
        resolve("Loaded all data");
    });
}
function readData(bot: keyof typeof botData) {
    return new Promise<string>((resolve, reject) => {
        let path = `./data/${bot}`;
        if (!existsSync(path)) {
            reject("No data folder found for " + bot);
            return;
        }
        const readDir = (path: string, currentDirType?: string) => {
            // console.log(`Entering ${path}`);
            let dirs = readdirSync(path, { withFileTypes: true })
                .map((d) => parse(path + "/" + d.name))
                .map((d) => ({ ...d, path: d.dir + "/" + d.base }));
            // console.log(dirs);
            for (let dir of dirs) {
                // console.log(`Reading ${dir.path}`);
                if (isDataTypeKey(dir.name)) currentDirType = dir.name;
                if (lstatSync(dir.path).isDirectory()) {
                    readDir(dir.path, currentDirType);
                    continue;
                }
                // let files = readdirSync(dir.path, { withFileTypes: true })
                //     .map((f) => dir.path + "/" + f.name)
                //     .filter((f) => f.endsWith(".json"));
                // for (let file of files) {
                // console.log(`Reading ${dir.path}`);
                let content = readFileSync(dir.path, "utf-8");
                let data = JSON.parse(content) as VariableType | CommandType | ActivatorType;
                if (!data.dataType && !currentDirType) {
                    throw new Error(`File ${dir.path} is not in a data type folder and has no dataType key`);
                }
                // if (dir.name == "command") data = clearCommand(data as CommandType<any>);
                // else if (dir.name == "variable") data = new DataVariable(data as VariableType<any>);
                // else data = clearActivator(data as ActivatorType);
                (botData as any)[bot][(data.dataType || currentDirType)!][data.name || dir.name] = data;
                // }
            }
        };
        readDir(path);

        resolve(`Loaded data for ${bot}`);
    });
}

function clearActivator(activator: ActivatorType) {
    if (!activator.dataType) activator.dataType = "activator";
    switch (activator.method) {
        case "slash":
            addSlashCommand(
                activator.bot,
                new SlashCommandBuilder().setName(activator.activator).setDescription(activator.description || "NO DESCRIPTION"),
                async (interaction) =>
                    // console.log("Running command " + activator.activator);
                    await runDataCommand(activator.command, interaction)
            );
            break;
        case "exclamation":
            addExclamationCommand(activator.bot, activator);
            break;
        case "message":
            addMessageCommand(activator.bot, activator);
            break;
    }
    return activator;
}

function clearCommand<T>(command: CommandType<T>) {
    if (!command.dataType) command.dataType = "command";
    switch (command.type) {
        case "function":
            if (typeof command.function == "string") command.function = eval(command.function as unknown as string);
            command.args = command.args?.map(clearCommand) || [];
            break;
        case "sequence":
        case "random":
            command.commands = command.commands.map(clearCommand);
            break;
        case "random-weighted":
            command.commands = command.commands.map((c) => ({ command: clearCommand(c.command), weight: c.weight }));
            break;
        case "conditional":
            const clearCondition = (condition: CommandCondition) => {
                if ("values" in condition) condition.values = condition.values.map((v) => clearCommand(v)) as [CommandType, CommandType];
                else condition.value = clearCommand<boolean>(condition.value);
                return condition;
            };
            if ("conditions" in command) for (let i in command.conditions) command.conditions[i] = clearCondition(command.conditions[i]);
            else command.condition = clearCondition(command.condition);
            command.ifTrue = clearCommand(command.ifTrue);
            if (command.ifFalse) command.ifFalse = clearCommand(command.ifFalse);
            break;
    }
    return command;
}

async function commandTextConverter(text: string, command: CommandType, moi?: Message | CommandInteraction, args?: any[]) {
    // console.log(text);
    let m = text.match(/\{[^{}]+?\}/gi);
    if (m)
        for (let match of m) {
            let keys = match.match(/(?<=[{:])([^{:}]+?)(?=[:}])/gi);
            let replace = (str = "") => (text = text.replace(match, str));

            // console.log(keys);
            if (!keys) continue;
            switch (keys[0]) {
                case "variable": {
                    let bot = keys[1];
                    let variable = keys[2];
                    if (!(bot in botData)) continue;
                    let value = await (botData as any)[bot]["variable"][variable].get();
                    replace(value);
                    break;
                }
                case "command": {
                    let bot = keys[1];
                    let _command = keys[2];
                    // if (!(bot in botData)) return text;

                    let value = `${await runDataCommand(
                        (_command == "this" || bot == "this") && "command" in command && command.command
                            ? command.command
                            : (botData as any)[bot]["command"][_command],
                        moi
                    )}`;
                    // console.log(value);
                    replace(value);
                    break;
                }
                case "target":
                case "author": {
                    let player = {
                        author: () => moi?.member,
                        target: () => getTargetMember(moi as Message),
                    }[keys[0]]();
                    if (!player) {
                        replace();
                        return;
                    }
                    let displaySize: AllowedImageSize = 2048;
                    if (keys[1] == "displayAvatar") {
                        let _ds = parseInt(keys[2]);
                        if ([16, 32, 64, 128, 256, 512, 1024, 2048, 4096].includes(_ds)) displaySize = _ds as AllowedImageSize;
                    }
                    replace(
                        {
                            displayName: player instanceof GuildMember ? player.displayName : player.nick || player.user.username,
                            username: player.user.username,
                            id: player instanceof GuildMember ? player.id : player.user.id,
                            mention: userMention(player instanceof GuildMember ? player.id : player.user.id),
                            displayAvatar:
                                player instanceof GuildMember
                                    ? player.displayAvatarURL({ size: displaySize, format: "png" })
                                    : `https://cdn.discordapp.com/avatars/${player instanceof GuildMember ? player.id : player.user.id}/${
                                          player.user.avatar
                                      }.webp?size=${displaySize}`,
                            exists: player ? "true" : "false",
                        }[keys[1]]
                    );
                    break;
                }
                case "arg": {
                    let arg = parseInt(keys[1]);
                    let value = args?.[arg];
                    replace(value);
                    break;
                }
                case "random": {
                    let min = 0;
                    let max;
                    if (keys.length > 3) {
                        min = parseInt(keys[1]);
                        max = parseInt(keys[2]);
                    } else max = parseInt(keys[1]);
                    replace(`${Math.floor(Math.random() * (max - min + 1)) + min}`);
                    break;
                }
            }
        }

    let emojiMatch = text.match(/(?<=:)[^:]+(?=:)/gi);

    if (emojiMatch) {
        let guild = await moi?.guild?.emojis.fetch();
        if (guild) {
            for (let match of emojiMatch) {
                let emoji = guild.find((e) => e.name == match);
                if (!emoji) continue;
                text = text.replace(new RegExp(`:${match}:`, "gi"), formatEmoji(emoji.id));
            }
        }
    }

    return text || undefined;
}

async function createImage(image: ImageType, command: CommandType, moi?: Message | CommandInteraction, args?: any[]) {
    let url = Array.isArray(image.url) ? random_from_array(image.url) : image.url;
    if (url) url = await commandTextConverter(url, command, moi, args);
    let img;
    if (url && url != "MISSING VALUE")
        try {
            img = await loadImage(url);
        } catch (err) {
            return undefined;
        }
    let width = image.size?.width || img?.width;
    let height = image.size?.height || img?.height;

    if (!(width && height)) return undefined;
    // throw "Width or height not provided for image or image url not found";

    let canvas = createCanvas(width, height);
    let ctx = canvas.getContext("2d");

    if (img) ctx.drawImage(img, 0, 0, width, height);
    else {
        ctx.fillStyle = image.color || "black";
        ctx.fillRect(0, 0, width, height);
    }

    if (image.composite) {
        for (let composite of image.composite) {
            let composite_img = await createImage(composite, command, moi, args);
            if (!composite_img) continue;
            ctx.drawImage(composite_img, composite.position?.x || 0, composite.position?.y || 0, composite_img.width, composite_img.height);
        }
    }

    for (let action of image.actions || []) {
        if (action.type == "rotate") {
            let rotationCanvas = createCanvas(width, height);
            let rotationCtx = rotationCanvas.getContext("2d");
            rotationCtx.translate(width / 2, height / 2);
            rotationCtx.rotate(action.angle * (Math.PI / 180));
            rotationCtx.translate(-width / 2, -height / 2);
            rotationCtx.drawImage(canvas, 0, 0, width, height);
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(rotationCanvas, 0, 0, width, height);
        } else if (action.type == "crop") {
            if (action.style == "in") {
                let cropCanvas = createCanvas(action.width, action.height);
                let cropCtx = cropCanvas.getContext("2d");
                cropCtx.drawImage(canvas, action.x, action.y, action.width, action.height, 0, 0, action.width, action.height);
                ctx.clearRect(0, 0, width, height);
                ctx.drawImage(cropCanvas, action.x, action.y, action.width, action.height);
            } else {
                ctx.clearRect(action.x, action.y, action.width, action.height);
            }
        }
    }

    return canvas;
}

function runDataCommand<T>(command: CommandType<T>, moi?: Message | CommandInteraction, args: any[] = [], startTime = Date.now()) {
    return new Promise<any>(async (resolve, reject) => {
        // console.log(command);
        if (!command) return reject("No command provided");
        if (command.clearArgs) args = [];
        if (command.args)
            args = [...args, ...(await Promise.all((await command.args?.map(async (c) => runDataCommand(c, moi, args, startTime))) || []))];

        switch (command?.type) {
            case "message":
                if (!moi) return reject("No message or interaction provided");
                if (moi instanceof Message) moi.channel.sendTyping();
                let text: Promise<string | undefined> | string | undefined = undefined;
                let image: Buffer | undefined = undefined;
                if ("text" in command && command.text) text = command.text;
                else if ("command" in command && command.command) text = `${await runDataCommand(command.command, moi, args, startTime)}`;
                // else throw new Error("No text or command provided");

                text = await text;
                // console.log(text);
                if (text) text = commandTextConverter(text, command, moi, args) || "NO VALUE";

                if ("image" in command && command.image) image = (await createImage(command.image, command, moi, args))?.toBuffer();

                let res = {
                    ...(moi instanceof CommandInteraction
                        ? ({
                              ephemeral: command.ephemeral,
                          } as InteractionReplyOptions)
                        : ({
                              messageReference: moi,
                              failIfNotExists: false,
                          } as ReplyOptions)),
                };
                let b: ReplyOptions | InteractionReplyOptions = {};
                if (image)
                    res = {
                        ...res,
                        files: [new MessageAttachment(image, command.name + ".png")],
                    };

                if (text) res = { ...res, content: await text };

                await wait(Math.max(0, (command.delay || 1000) - (Date.now() - startTime)));
                moi.reply(res as any)
                    .then(resolve)
                    .catch(reject);
                return;
            case "command":
                if (!botNames.includes(command.command.bot)) return reject("Invalid bot name: " + command.command.bot);
                let newCommand = botData[command.command.bot]["command"][command.command.name];
                if (!newCommand)
                    return reject(
                        `\nError:\n\t${command.command.bot} has no command named ${command.command.name}\n\n${
                            command.command.bot
                        } has these commands:\n\t${Object.keys(botData[command.command.bot]["command"]).join("\n\t")}`
                    );
                runDataCommand(newCommand, moi, args, startTime).then(resolve).catch(reject);
                return;
            case "function":
                try {
                    if (typeof command.function == "string") command.function = eval(command.function);
                    if (typeof command.function != "function") throw "Function commands must eval to a function";
                    let res = await command.function(...args, moi, command);
                    resolve(res);
                } catch (err) {
                    reject(err);
                }
                return;
            case "sequence":
                try {
                    let res = [];
                    for (let _command of command.commands) res.push(await runDataCommand(_command, moi, args, startTime));
                    resolve(res);
                } catch (err) {
                    reject(err);
                }
                return;
            case "random":
                await runDataCommand(random_from_array(command.commands), moi, args, startTime).then(resolve).catch(reject);
                return;
            case "random-weighted":
                let _command = command.commands[weightedRandom(command.commands)()] as {
                    command: CommandType<T>;
                    weight: number;
                };
                runDataCommand(_command.command, moi, args, startTime).then(resolve).catch(reject);
                return;
            case "string":
                commandTextConverter(command.value, command, moi, args).then(resolve).catch(reject);
                return;
            case "boolean":
                resolve(command.value);
                return;
            case "array": {
                try {
                    let res =
                        "commandArray" in command
                            ? await Promise.all(command.commandArray.map(async (c) => runDataCommand(c, moi, args, startTime)))
                            : command.array;
                    resolve(res);
                } catch (err) {
                    reject(err);
                }
                return;
            }
            case "conditional": {
                let value;
                const getCondtion = async (condition: CommandCondition) => {
                    let value;
                    if ("values" in condition) {
                        let values = condition.values.map((v) => runDataCommand(v, moi, args, startTime));
                        values = await Promise.all(values);
                        const compare = () => {
                            if (!("comparison" in condition)) throw new Error("No comparison provided");
                            switch (condition.comparison) {
                                case "==":
                                    return values[0] == values[1];
                                case "!=":
                                    return values[0] != values[1];
                                case ">":
                                    return values[0] > values[1];
                                case "<":
                                    return values[0] < values[1];
                                case ">=":
                                    return values[0] >= values[1];
                                case "<=":
                                    return values[0] <= values[1];
                                case "includes":
                                    if (typeof values[0] != "string" && !Array.isArray(values[0]))
                                        throw new Error(`Invalid type for the first value: ${typeof values[0]}\nExpected string or array`);
                                    return values[0].includes!(values[1]);
                                default:
                                    throw new Error("Invalid comparison: " + condition.comparison);
                            }
                        };
                        value = compare();
                    } else {
                        value = await runDataCommand(condition.value, moi, args, startTime);
                        if (typeof value == "string") value = value == "true" ? true : value == "false" ? false : value;
                        value = !!value;
                    }
                    if (condition.not) value = !value;
                    return value;
                };
                if ("conditions" in command) {
                    for (let condition of command.conditions) {
                        value = await getCondtion(condition);
                        if (!value) break;
                    }
                } else value = await getCondtion(command.condition);
                // console.log(command, value);

                if (value) runDataCommand(command.ifTrue, moi, args, startTime).then(resolve).catch(reject);
                else if (command.ifFalse) runDataCommand(command.ifFalse, moi, args, startTime).then(resolve).catch(reject);
                else resolve(undefined as any);
                return;
            }
            case "set-variable":
            case "get-variable":
                let variable: DataVariable;
                if (typeof command.variable == "string") {
                    if (!("bot" in command) || !command.bot) throw new Error("No bot provided");
                    variable = botData[command.bot]["variable"][command.variable];
                } else variable = new DataVariable(command.variable);
                if (command.type == "get-variable")
                    variable
                        .get(moi?.guild, moi instanceof Message ? moi.author : moi?.user)
                        .then(resolve)
                        .catch(reject);
                else
                    variable
                        .set(
                            await runDataCommand(command.newValue, moi, args, startTime),
                            moi?.guild,
                            moi instanceof Message ? moi.author : moi?.user
                        )
                        .then(resolve)
                        .catch(reject);
                return;
            default:
                throw new Error("Invalid command type: " + (command as any).type);
        }
    });
}

export function changeActivities() {
    if (testing) return;
    if (!(ray.isReady() && krystal.isReady() && sadie.isReady() && eli.isReady() && cerby.isReady() && sieg.isReady() && d20.isReady())) return;

    let test_padoru = () => {
        let padoru_chance: number;
        if (new Date().getMonth() == 10) padoru_chance = 50;
        else if (new Date().getMonth() == 11) padoru_chance = 85;
        else return false;
        if (randomchance(padoru_chance)) return true;
        else return false;
    };

    let change_to_padoru = (a: CustomActivity[]) => {
        let bot: string;
        let avatar: string;
        let nickname: string;

        switch (a) {
            case eli_activities:
                bot = "eli";
                avatar = assets.eli.avatars.padoru;
                nickname = "Padoru Eli";
                break;
            case krystal_activities:
                bot = "krystal";
                avatar = assets.krystal.avatars.padoru;
                nickname = "Padoru Krystal";
                break;
            case ray_activities:
                bot = "ray";
                avatar = assets.ray.avatars.padoru;
                nickname = "Padoru Ray";
                break;
            case sadie_activities:
                bot = "sadie";
                avatar = assets.sadie.avatars.padoru;
                nickname = "Padoru Sadie";
                break;
            default:
                return;
                break;
        }

        changeActivity(bot, "LISTENING", "padoru", avatar, undefined, nickname);
    };

    [eli_activities, ray_activities, sadie_activities, krystal_activities].forEach((a) => {
        let ac: CustomActivity = random_from_array(a);
        if (test_padoru()) {
            change_to_padoru(a);
            return;
        }
        changeActivity(...random_from_array(a));
    });

    setTimeout(changeActivities, 1000 * 60 * 30);
}

export function ignore_message(msg: Message, bot: Client): boolean {
    if (!msg || !msg.member || !msg.author || msg.author.bot || msg.channel.isThread()) return true;
    if (msg.content.startsWith("!")) return true;
    if (ignore_channels.includes(msg.channel.id)) return true;
    if (testing) {
        if (msg.channelId != testChannelId) return true;
    } else if (msg.channelId == testChannelId) return true;
    // if ((!(disturb_channels.includes(msg.channel.id))) && bot.user?.presence.status == 'dnd') return true;
    return false;
}

export type imageComponent =
    | {
          path: string | Buffer;
          x?: number;
          y?: number;
          width?: number;
          height?: number;
      }
    | string
    | Buffer;

export async function makeimage(
    width: number,
    height: number,
    avatar: imageComponent,
    background?: imageComponent,
    foreground?: imageComponent
): Promise<Canvas> {
    return new Promise(async (resolve, reject) => {
        try {
            let canvas = createCanvas(width, height);
            let ctx = canvas.getContext("2d");
            const composite = async (cmp: imageComponent) => {
                if (typeof cmp == "string" || cmp instanceof Buffer) cmp = { path: cmp };
                ctx.drawImage(await loadImage(cmp.path), cmp.x || 0, cmp.y || 0, cmp.width || width, cmp.height || height);
            };

            if (background) await composite(background);
            await composite(avatar);
            if (foreground) await composite(foreground);

            resolve(canvas);
        } catch (err) {
            console.error(err);
            reject(err);
        }
    });
}

export const imageCommand = (
    bot: Client,
    msg: Message | undefined,
    target: User | undefined,
    width: number,
    height: number,
    avatar?: Omit<Exclude<imageComponent, string | Buffer>, "path">,
    background?: imageComponent,
    foreground?: imageComponent,
    default_image?: Buffer | MessageAttachment
) =>
    new Promise<Buffer | MessageAttachment>(async (resolve, reject) => {
        if (!(target || default_image)) target = bot.user || msg?.author;
        msg?.channel.sendTyping();
        let start_time = new Date().valueOf();

        let avt: imageComponent | undefined;
        if (avatar && target) {
            avt = {
                path: target?.displayAvatarURL({ format: "png", size: 1024 }),
                x: avatar.x,
                y: avatar.y,
                width: avatar.width,
                height: avatar.height,
            };
        }

        let img: Buffer | MessageAttachment | undefined;
        if (target && avt) img = await (await makeimage(width, height, avt, background, foreground)).toBuffer();
        else img = default_image;

        if (!img) return reject();

        if (msg) await say(bot, msg.channel, { files: [img] }, new Date().valueOf() - start_time);
        return resolve(img);
    });
export const wait = (millis: number): Promise<void> =>
    new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, millis);
    });

export const get_birds = () =>
    readFileSync("./birdlist.txt", "utf-8")
        .split("\n")
        .map((b) => b.match(/(?<bird>.+?) \(url: (?<url>https:\/\/en.wikipedia.org\/wiki\/.+?)\)/)!.groups!);

export const get_powers = () =>
    readFileSync("./bird_powers.txt", "utf-8")
        .split("\n")
        .map((a) => JSON.parse(a));

export function getCharacterEmoji(character?: string) {
    // if (!character) return emojis[random_from_array(Object.keys(emojis))];
    // if (character.match(/d20/i)) return "";
    // let res = "";
    // ["sadie", "ray", "krystal", "eli"].forEach((a) => {
    //     if (character.match(new RegExp(a, "i")))
    //         res = emojis[random_from_array(Object.keys(emojis).filter((emoji) => emoji.match(new RegExp(":gm" + a, "i"))))];
    // });
    // if (res != "") return res;
    // return emojis[random_from_array(Object.keys(emojis))];
}

export function weightedRandom<T extends { weight: number } | number, S extends Record<string | number, T> | T[]>(spec: S) {
    let table: (keyof S)[] = [];
    for (const i in spec) {
        let item = spec[i] as T;
        let weight = typeof item == "number" ? item : item.weight;
        for (let j = 0; j < weight; j++) table.push(i);
    }
    return () => random_from_array(table);
}

export function spawnAsync(command: string, args: string[] = []) {
    console.log(command, args.join(" "));
    let spawned = spawn(command, args);
    spawned.stdout.on("data", (data) => console.log(data.toString()));
    spawned.stderr.on("data", (data) => console.error(data.toString()));
    return new Promise<number>((resolve, reject) => {
        spawned.on("close", (code) => {
            if (code == 0) resolve(code);
            else reject(code);
        });
    });
}

export const gitpull = async (msg?: Message) => {
    if (isRestarting()) {
        if (msg) say(d20, msg.channel, "The bots are restarting");
        return;
    }
    setRestarting(true);
    console.log("Pulling...");
    if (msg) await say(d20, msg.channel, "Pulling...", 0);
    try {
        await spawnAsync("git", ["pull"]);
        await mod_alert_webhook(testing).send("Pulled from git");
        await readAllBotData();
        await mod_alert_webhook(testing).send("Reloaded command data");
        await setRestarting(false);
    } catch (err) {
        console.log("Something went wrong while updating");
        if (msg) await say(d20, msg.channel, "Something went wrong while updating");
    }
};

export const update = async (msg?: Message) => {
    if (isRestarting()) {
        if (msg) say(d20, msg.channel, "The bots are already restarting");
        return;
    }
    setRestarting(true);
    console.log("Updating...");
    if (msg) await say(d20, msg.channel, "Updating...", 0);
    try {
        await spawnAsync("git", ["pull"]);
        await spawnAsync("pnpm", ["install"]);
        await spawnAsync("tsc");
        await spawnAsync("pm2", ["restart", "all"]);
    } catch (err) {
        console.log("Something went wrong while updating");
        if (msg) await say(d20, msg.channel, "Something went wrong while updating");
    }
};

export const restart = async (msg?: Message) => {
    if (isRestarting()) {
        if (msg) say(d20, msg.channel, "The bots are already restarting");
        return;
    }
    setRestarting(true);
    console.log("Restarting...");
    if (msg) await say(d20, msg.channel, "Restarting...", 0);
    await spawnAsync("pm2", ["restart", "all"]);
};

export const stop = async (msg?: Message) => {
    if (isRestarting()) {
        if (msg) say(d20, msg.channel, "The bots are already restarting");
        return;
    }
    setRestarting(true);
    console.log("Stopping...");
    if (msg) await say(d20, msg.channel, "Stopping...", 0);
    await spawnAsync("pm2", ["stop", "all"]);
};

export async function getCardStyle(userId: string) {
    return (await (await database.child(`card/` + userId).once("value")).val()) as CardStyle;
}
export async function setCardStyle(
    userId: string,
    style: {
        type?: string;
        color?: string;
        color2?: string;
        title?: string;
    }
) {
    for (const key in style)
        if (!style[key as "type" | "color" | "color2" | "title"]) {
            delete style[key as "type" | "color" | "color2" | "title"];
            await database.child(`card/` + userId + "/" + key).remove();
        }
    return database.child(`card/` + userId).update(style);
}

export async function sendCardCustomizationMessage(
    moi: Message | SelectMenuInteraction | ModalSubmitInteraction | ButtonInteraction,
    shouldReturn = false,
    previous?: CardStyle,
    previousText?: string,
    isCard = !(moi instanceof Message ? moi.content.startsWith("!") : moi.message?.content.startsWith("!"))
) {
    if (isCard && !(moi instanceof Message)) await moi.deferUpdate({ fetchReply: true });
    let id = moi instanceof Message ? moi.author.id : moi.user.id;
    let style: CardStyle = await getCardStyle(id);
    if (!style) style = defaultstyle;
    else {
        if (!style["type"]) style["type"] = defaultstyle["type"];
        if (!style["color"]) style["color"] = defaultstyle["color"];
        if (!style["color2"]) style["color2"] = defaultstyle["color2"];
    }
    let infoEmbed = new MessageEmbed();
    if (!isCard) {
        if (style["title"])
            infoEmbed
                .setColor((style.color || defaultstyle.color) as HexColorString)
                .addFields([{ name: "TITLE", value: style["title"] ? style["title"] : "None" }]);
        if (style["color"])
            infoEmbed.addFields([
                {
                    name: "COLOR A",
                    value: style["color"] ? style["color"] : "None",
                    inline: true,
                },
            ]);
        if (style["color2"])
            infoEmbed.addFields([
                {
                    name: "COLOR B",
                    value: style["color2"] ? style["color2"] : "None",
                    inline: true,
                },
            ]);

        if (style["type"])
            infoEmbed.addFields([
                {
                    name: "XP BAR STYLE",
                    value: style["type"]
                        ? ({
                              normal: "Default",
                              stripes: "Striped",
                              stripes2: "Striped (b)",
                              dual: "Dual",
                              dualb: "Dual (b)",
                          }[style["type"]] as string)
                        : "None",
                    inline: false,
                },
            ]);
    }
    let embeds = isCard ? null : [infoEmbed];

    let files = [];
    if (isCard) files.push(await generatecard(moi));
    else files.push((await createXpBar(style["type"], style["color"], style["color2"])).toBuffer());

    let components: MessageActionRow[] = [];

    let selectMenu = new MessageSelectMenu().setCustomId("card_xpbar").setPlaceholder("Choose a xp bar style");
    let addStyle = (label: string, value: string, description: string) =>
        selectMenu.addOptions([{ label, value, description, default: style["type"] == value }]);
    addStyle("Default", "normal", "The default xp bar style");
    addStyle("Striped", "stripes", "A striped version of the xp bar");
    addStyle("Striped (b)", "stripes2", "Alternative version of the striped xp bar");
    addStyle("Dual", "dual", "Multicolored version of the striped xp bar");
    addStyle("Dual (b)", "dualb", "Alternative version of the multicolored striped xp bar");
    let selectMenuRow = new MessageActionRow().addComponents(selectMenu);
    let buttonRow = new MessageActionRow().addComponents(
        new MessageButton().setCustomId("card_title").setLabel("Change title").setStyle("PRIMARY"),
        new MessageButton().setCustomId("card_colors").setLabel("Change colors").setStyle("PRIMARY")
    );
    buttonRow.addComponents(
        new MessageButton()
            .setCustomId(isCard ? "xp_mode" : "card_mode")
            .setLabel(isCard ? "XP bar mode (faster)" : "Card mode (slower)")
            .setStyle("PRIMARY")
    );

    let previousButton = new MessageButton();
    if (previous) {
        let id = "card_previous?";
        if (previous.type) id += `s=${previous.type}&`;
        if (previous.color) id += `a=${previous.color}&`;
        if (previous.color2) id += `b=${previous.color2}&`;
        if (previous.title) id += `t=${previous.title}&`;
        if (previousText) id += `p=&`;
        if (id.substring(id.length - 1) == "&") id = id.substring(0, id.length - 1);
        previousButton
            .setCustomId(id)
            .setLabel(previousText || "UNDO")
            .setStyle("DANGER");
        buttonRow.addComponents(previousButton);
    }

    components.push(selectMenuRow, buttonRow);
    let info = {
        content: `${isCard ? "" : "!"}<@${id}>'s card`,
        embeds,
        files,
        components,
    } as MessageOptions;
    if (!(moi instanceof Message)) await (moi.message as Message).suppressEmbeds(isCard);

    return shouldReturn
        ? info
        : moi instanceof Message
        ? moi.channel?.send(info)
        : isCard
        ? moi.editReply(info)
        : moi.update(info as InteractionUpdateOptions);
}

export const gitAddAsync = (paths: string | string[]) =>
    new Promise((resolve, reject) => simpleGit().add(paths, (err, result) => (err ? reject(err) : resolve(result))));
export const gitCommitAsync = (message: string | string[], files?: string | string[], options?: { [key: string]: string }) =>
    new Promise((resolve, reject) => simpleGit().commit(message, files, options, (err, result) => (err ? reject(err) : resolve(result))));
export const gitPushAsync = (remote: string, branch: string, options?: { [key: string]: string }) =>
    new Promise((resolve, reject) => simpleGit().push(remote, branch, options, (err, result) => (err ? reject(err) : resolve(result))));

let exclamationCommands: Partial<
    Record<
        BotNames,
        {
            activators: string[];
            command: CommandType;
            name?: string;
        }[]
    >
> = {};
let messageCommands: Partial<
    Record<
        BotNames,
        (ActivatorType & {
            method: "message";
            matches: string[];
            matchType: "any" | "all";
        })[]
    >
> = {};

function addMessageCommand(bot: BotNames, activator: ActivatorType) {
    if (activator.method != "message") return;
    let matches = "match" in activator ? [activator.match] : activator.matches;
    let matchType;
    if ("matchType" in activator) matchType = activator.matchType;
    matchType = matchType || "any";
    if (!messageCommands[bot]) messageCommands[bot] = [];

    messageCommands[bot] = messageCommands[bot]?.filter((a) => a.name != activator.name);
    messageCommands[bot]!.push({ ...activator, matches, matchType });
}

function addExclamationCommand(bot: BotNames, activator: ActivatorType) {
    if (activator.method != "exclamation") return;
    let activators = "activator" in activator ? [activator.activator] : activator.activators;
    if (!exclamationCommands[bot]) exclamationCommands[bot] = [];

    exclamationCommands[bot] = exclamationCommands[bot]?.filter((a) => a.name != activator.name);
    exclamationCommands[bot]!.push({ activators, command: activator.command, name: activator.name });
}

export async function testMessageCommand(botName: BotNames, msg: Message) {
    let bot = clients[botName];
    if (ignore_message(msg, bot)) return;

    let content = msg.content.toLowerCase();
    if (content.startsWith("!")) return;

    let activators = messageCommands[botName];
    if (!activators) return;

    let hasBot = testWord(content, botName);
    if (hasBot) msg.channel.sendTyping();

    for (let activator of activators) {
        if ((hasBot || !activator.botName) && (activator.matchType == "all" ? testAllWords : testWord)(content, ...activator.matches)) {
            if (await runDataCommand(activator.command, msg).catch((err) => console.error(err))) break;
        }
    }
}

export function testExclamationCommand(botName: BotNames, msg: Message) {
    if (testing && msg.channelId != testChannelId) return;
    if (!testing && msg.channelId == testChannelId) return;
    let bot = clients[botName];
    let content = msg.content.toLowerCase();
    if (!content.startsWith("!")) return;
    let activators = exclamationCommands[botName];
    if (!activators) return;
    // console.log(msg.content);
    let words = content.split(" ");
    let activator = words[0].slice(1);
    let command = activators.find((a) => a.activators.includes(activator));
    if (!command) return;
    runDataCommand(command.command, msg);
}

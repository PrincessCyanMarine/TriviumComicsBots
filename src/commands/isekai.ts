import { SlashCommandAttachmentOption, SlashCommandBuilder, SlashCommandChannelOption } from "@discordjs/builders";
import { addD20SlashCommand } from "../interactions/slash/d20";
import axios from "axios";
import { botNames } from "../model/botData";
import { clients } from "../clients";
import { Client, MessageOptions, MessagePayload, TextChannel } from "discord.js";
import { wait } from "../common/functions";
import { dodoId, dumbassId, marineId } from "../common/variables";

const fileOption = new SlashCommandAttachmentOption().setName("file").setDescription("Text file to use for the episode").setRequired(true);
const channelOption = new SlashCommandChannelOption().setName("channel").setDescription("The channel to send the episode to").setRequired(false).addChannelTypes(0);
const command = new SlashCommandBuilder()
    .addAttachmentOption(fileOption)
    .addChannelOption(channelOption)
    .setName("isekai")
    .setDescription("Runs the isekai episode");

type Line = {
    character: Client;
    delay: number;
    typingTime: number;
} & ( { type: "message", content: string | MessageOptions; } | { type: "reaction", content: string; } );

const createLine = (character: Client, delay: number, typingTime: number, type: Line["type"]): Line => ({
    character,
    delay,
    typingTime,
    content: "",
    type,
});

addD20SlashCommand(command, async (interaction) => {
    try {
        if (![marineId, dodoId, dumbassId].includes(interaction.user.id)) {
            await interaction.reply({ content: "You do not have permission to use this command", ephemeral: true });
            return;
        }
        await interaction.reply("Fetching script...")
        let file = interaction.options.get("file")?.attachment;
        if (!file) {
            await interaction.editReply("No file found");
            return;
        }
        if (!file.contentType?.startsWith("text")) {
            await interaction.editReply("File must be a text file");
            return;
        }
        let content;
        try {
            content = await axios.get(file.url);
            if (typeof content.data !== "string") throw new Error("Data is not a string.\n" + typeof content.data);
        } catch (e) {
            console.error(e);
            await interaction.editReply("Error reading file");
            return;
        }
    
        await interaction.editReply("Parsing script...");
        let lines = content.data.split("\n").map((line) => line.replace(/[\r\n]/g, ""));
        const episode: Line[] = [];
        const characters: Client[] = [];
    
        let currentLine: Line | null = null;
        const addLine = () => {
            if (!!currentLine) {
                if (typeof currentLine.content == "string"){
                    currentLine.content = currentLine.content.trim();
                    if (!currentLine.content) {
                        throw `Cannot have empty messages`;
                    }
                } else if (typeof currentLine.content.content == "string"){
                    let content = currentLine.content.content.trim();
                    if (content) currentLine.content.content = content;
                    else delete currentLine.content.content;
                }
                episode.push(currentLine);
            }
        }
        const addCharacter = async (character: string) => {
            if (!botNames.includes(character as any))
                throw `Character ${character} not found`;
            const bot = clients[character as keyof typeof clients];
            if (!bot)
                throw `Character ${character} not found`;
            characters.push(bot);
            return bot;
        }
        const parseNum = (str: string) =>  {
            let num = parseInt(str);
            if (isNaN(num)) num = 0;
            return num;
        }
        let end = false;
        let i = 0;
        try {
            for (let line of lines) {
                i++;
                if (line.startsWith("--")) continue;
                const args = line.replace(/^[#!]\s?/, "").replace(/[\r\n]/g, "").split(" ");
                if (line.startsWith("#")) {
                    addLine();
                    let [character, _delay, _typingTime] = args;
                    character = character.toLowerCase();
                    const bot = await addCharacter(character);
                    if (!bot) return;
                    let delay = parseNum(_delay);
                    let typingTime = parseNum(_typingTime);
                    currentLine = createLine(bot, delay, typingTime, "message");
                    continue;
                }
                if (line.startsWith("!")) {
                    let type = args.shift()?.toLowerCase();
                    switch (type) {
                        case "react":
                            addLine();
                            let [character, emoji, _delay] = args;
                            const bot = await addCharacter(character);
                            if (!bot) return;
                            let delay = parseNum(_delay);
                            currentLine = createLine(bot, delay, 0, "reaction");
                            currentLine.content = emoji;
                            if (currentLine.content.startsWith(":")) {
                                let emoji = await currentLine.character.emojis.resolve(currentLine.content)
                                if (!emoji) {
                                    const [name, id] = currentLine.content.slice(1, -1).split(":");
                                    emoji = currentLine.character.emojis.cache.find((emoji) => emoji.name == name && (!id || emoji.id == id)) || null;
                                }
                                if (!emoji) throw `Emoji ${currentLine.content} not found`;
                                currentLine.content = emoji.id;
                            } else {
                                if (!currentLine.content.match(/^[0-9]+$/)) {
                                    throw `Invalid emoji ${currentLine.content}`;
                                }
                            }
                            break;
                        case "image":
                            let [url] = args;
                            if (!url) throw `No url found`;
                            if (!currentLine) throw `No message found`;
                            if (currentLine.type != "message") throw `Cannot add image to non-message line`;
                            if (typeof currentLine.content == "string"){
                                currentLine.content = { content: currentLine.content };
                            }
                            if (!currentLine.content.files)
                                currentLine.content.files = [];
                            currentLine.content.files.push(url);
                            break;
                        case "end":
                            end = true;
                            break;
                        default:
                            throw `Unknown command ${type}`;
                    }
                    if (end) break;
                    continue;
                }
                if (currentLine && currentLine.type == "message") {
                    let content = line.replace(/^\\#/, "#").replace(/^\\!/, "!").replace(/^\\--/, "--") + "\n";
                    if (!content) content = "\n";
                    if (typeof currentLine.content == "string") currentLine.content += content;
                    else currentLine.content.content += content;
                }
            }
        } catch(e) {
                console.error(e);
                await interaction.editReply({ content: `Error parsing script on line ${i}\n${e}` });
                return;
        }
        addLine();
        let channelId = interaction.options.getChannel("channel")?.id || interaction.channelId;
        const channels: Record<string, TextChannel> = {};
        for (let character of characters) {
            const channel = await character.channels.fetch(channelId);
            if (!channel || !(channel instanceof TextChannel)) {
                await interaction.editReply({ content: `Channel ${channelId} not found` });
                return;
            }
            channels[character.user!.id] = channel;
        }
        await interaction.editReply("Isekai episode running...");
        let currentMessage = null;
        let previousCharacter = null;
        for (let line of episode) {
            let channel = channels[line.character.user!.id];
            if (!channel) {
                console.error("Error finding channel");
                await interaction.editReply({ content: `Error finding channel for ${line.character.user!.id}` });
                return;
            }
            if (line.delay > 0) await wait(line.delay);
            switch (line.type) {
                case "message":
                    await channel.sendTyping();
                    if (line.typingTime > 0) 
                        await wait(line.typingTime);
                    
                    try {
                        currentMessage = await channel.send(line.content as string);
                        if (!currentMessage) throw new Error("Error sending message");
                    } catch (e) {
                        console.error(e);
                        await interaction.editReply({ content: `Error sending message` });
                        return;
                    }
                    break;
                case "reaction":
                    if (!currentMessage) {
                        await interaction.editReply({ content: `No message to react to` });
                        return;
                    }
                    if (line.character != previousCharacter)
                        currentMessage = await channel.messages.fetch(currentMessage.id);   
                    try {
                        await currentMessage.react(line.content);
                    } catch (e) {
                        console.error(e);
                        await interaction.editReply({ content: `Error reacting to message` });
                        return;
                    }
                    break;
                default:
                    await interaction.editReply({ content: `Unknown line type ${(line as any).type}` });
                    return;
            }
            previousCharacter = line.character;
        }
        await interaction.editReply("Isekai episode finished");
    } catch(e) {
        console.error(e);
        interaction.editReply({ content: `Error running isekai episode` }).catch(console.error);
    }
})

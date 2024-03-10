import { SlashCommandAttachmentOption, SlashCommandBuilder, SlashCommandChannelOption } from "@discordjs/builders";
import { addD20SlashCommand } from "../interactions/slash/d20";
import axios from "axios";
import { botNames } from "../model/botData";
import { clients } from "../clients";
import { Client, TextChannel } from "discord.js";
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
    content: string;
    character: Client;
    delay: number;
    typingTime: number;
};

const createLine = (character: Client, delay: number, typingTime: number): Line => ({
    character,
    delay,
    typingTime,
    content: "",
});

addD20SlashCommand(command, async (interaction) => {
    if (![marineId, dodoId, dumbassId].includes(interaction.user.id)) {
        await interaction.reply({ content: "You do not have permission to use this command", ephemeral: true });
        return;
    }
    console.log("Isekai episode started");
    await interaction.reply("Fetching script...")
    let file = interaction.options.get("file")?.attachment;
    console.log(file);
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
    const characters = [];

    let currentLine: Line | null = null;
    const addLine = () => {
        if (currentLine) {
            currentLine.content = currentLine.content.trim();
            episode.push(currentLine);
        }
    }
    for (let line of lines) {
        console.log(line);
        if (line.startsWith("#")) {
            addLine();
            let [character, _delay, _typingTime] = line.toLowerCase().replace(/^#\s?/, "").replace(/[\r\n]/g, "").split(" ");
            if (!botNames.includes(character as any)) {
                await interaction.editReply({ content: `Character ${character} not found` });
                return;
            }
            const bot = clients[character as keyof typeof clients];
            if (!bot) {
                await interaction.editReply({ content: `Character ${character} not found` });
                return;
            }
            characters.push(bot);
            let delay = parseInt(_delay);
            if (isNaN(delay)) delay = 0;
            let typingTime = parseInt(_typingTime);
            if (isNaN(typingTime)) typingTime = 0;
            currentLine = createLine(bot, delay, typingTime);
            continue;
        }
        if (currentLine) currentLine.content += line.replace(/^\\#/, "#") + "\n";
    }
    addLine();
    console.log(episode);
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
    for (let line of episode) {
        console.log(line);
        let channel = channels[line.character.user!.id];
        if (!channel) {
            console.error("Error finding channel");
            await interaction.editReply({ content: `Error finding channel for ${line.character.user!.id}` });
            return;
        }
        if (line.delay > 0) await wait(line.delay);
        await channel.sendTyping();
        if (line.typingTime > 0) await wait(line.typingTime);
        try {
            let message = await channel.send({ content: line.content, allowedMentions: { parse: [] } });
            if (!message) throw new Error("Error sending message");
        } catch (e) {
            console.error(e);
            await interaction.editReply({ content: `Error sending message` });
            return;
        }
    }
    await interaction.editReply("Isekai episode finished");
})

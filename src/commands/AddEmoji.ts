import { createWriteStream } from "fs";
import { get } from "https";
import { addD20SlashCommand } from "../interactions/slash/d20";
import { SlashCommandAttachmentOption, SlashCommandBuilder, SlashCommandStringOption, SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { gitAddAsync, gitCommitAsync, gitPushAsync, spawnAsync, wait } from "../common/functions";
import { GuildMember } from "discord.js";
import { marineId, triviumGuildId } from "../common/variables";

// https://stackoverflow.com/a/11944984
const download = (url: string, path: string) =>
    new Promise((resolve, reject) => {
        try {
            const file = createWriteStream(path);
            get(url, function (response) {
                response.pipe(file);

                // after download completed close filestream
                file.on("finish", () => {
                    file.close();
                    resolve(file);
                });
                file.on("error", (err) => {
                    reject(err);
                });
            });
        } catch (err) {
            reject(err);
        }
    });
let command = new SlashCommandBuilder().setName("addemoji").setDescription("Adds an emoji to the emoji rotation");

let nameOption = new SlashCommandStringOption().setName("name").setDescription("The name of the emoji").setRequired(true);
let urlOption = new SlashCommandStringOption().setName("url").setDescription("The url of the emoji").setRequired(true);
let fileOption = new SlashCommandAttachmentOption().setName("file").setDescription("The file of the emoji").setRequired(true);
let extensionOption = new SlashCommandStringOption()
    .setName("extension")
    .setDescription("The extension of the image")
    .setChoices({ name: "png", value: "png" }, { name: "jpeg", value: "jpeg" }, { name: "gif", value: "gif" })
    .setRequired(false);
let rotationType = new SlashCommandStringOption()
    .setName("rotation")
    .setDescription("whether the emoji should be permanent or cycled")
    .setChoices({ name: "permanent", value: "permanent" }, { name: "cycled", value: "cycled" })
    .setRequired(false);

let subcommands = [];
let makeSubcommand = (name: string, description: string) =>
    new SlashCommandSubcommandBuilder().setName(name).setDescription(description).addStringOption(nameOption);

subcommands.push(makeSubcommand("file", "Use a file to set the emoji's image").addAttachmentOption(fileOption));
subcommands.push(makeSubcommand("url", "Use an url to set the emoji's image").addStringOption(urlOption));

for (let subcommand of subcommands) {
    subcommand.addStringOption(extensionOption).addStringOption(rotationType);
    command.addSubcommand(subcommand);
}

// command.addStringOption((option) => option.setName("url").setDescription("The url of the emoji (ignored if a file is selected)").setRequired(false));
// command.addAttachmentOption((option) => option.setName("file").setDescription("The file of the emoji").setRequired(false));
addD20SlashCommand(command, async (interaction) => {
    try {
        if (interaction.user.id != marineId) {
            if (interaction.guildId != triviumGuildId) {
                interaction.reply({ content: "This command can only be used in the Trivium Comics' server", ephemeral: true });
                return;
            }
            if (!(interaction.member as GuildMember)?.permissions.has("MANAGE_EMOJIS_AND_STICKERS")) {
                interaction.reply({ content: "You must have the Manage Emojis and Stickers permission to use this command", ephemeral: true });
                return;
            }
        }
        let name = interaction.options.getString("name", true).replace(/\s/g, "");
        let url = interaction.options.getString("url", false);
        let file = interaction.options.getAttachment("file", false);
        let extension = interaction.options.getString("extension", false);
        let rotation = interaction.options.getString("rotation", false);
        if (!extension) extension = "png";
        if (!rotation) rotation = "cycled";
        if (!url && !file) {
            interaction.reply("You must specify a url or a file");
            return;
        }
        if (url && file) {
            interaction.reply("You must specify either a url or a file, not both");
            return;
        }
        let path = `./assets/emojis/${rotation}/${name}.${extension}`;
        if (file) url = file.url;
        if (!url) {
            interaction.reply("Something went wrong...");
            return;
        }
        await interaction.reply("Downloading emoji...");
        await download(url, path);
        await interaction.editReply("Emoji downloaded, adding to rotation...");
        await gitAddAsync(path);
        await gitCommitAsync("Added emoji to rotation through slash command", [path]);
        await gitPushAsync("origin", "master");
        await interaction.editReply("Emoji added to rotation");
    } catch (err) {
        console.error(err);
        if (interaction.replied || interaction.deferred) interaction.editReply("Something went wrong...");
        else interaction.reply("Something went wrong...");
    }
});

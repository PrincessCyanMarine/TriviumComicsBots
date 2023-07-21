import { createWriteStream, existsSync, readdirSync, rmSync } from "fs";
import { get } from "https";
import { addD20SlashCommand } from "../interactions/slash/d20";
import { SlashCommandAttachmentOption, SlashCommandBuilder, SlashCommandStringOption, SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { gitAddAsync, gitCommitAsync, gitPushAsync, spawnAsync, wait } from "../common/functions";
import { cycPath, permPath } from "../d20/EmojiCycler";

let command = new SlashCommandBuilder().setName("removeemoji").setDescription("Removes an emoji from the emoji rotation");

let emojiOption = new SlashCommandStringOption().setName("emoji").setDescription("The emoji to remove").setRequired(true);

command.addStringOption(emojiOption);

// let subcommands = [];
// let makeSubcommand = (name: string, description: string) =>
// new SlashCommandSubcommandBuilder().setName(name).setDescription(description).addStringOption(nameOption);

// subcommands.push(makeSubcommand("file", "Use a file to set the emoji's image").addAttachmentOption(fileOption));
// subcommands.push(makeSubcommand("url", "Use an url to set the emoji's image").addStringOption(urlOption));

// for (let subcommand of subcommands) {
// subcommand.addStringOption(extensionOption).addStringOption(rotationType);
// command.addSubcommand(subcommand);
// }

// command.addStringOption((option) => option.setName("url").setDescription("The url of the emoji (ignored if a file is selected)").setRequired(false));
// command.addAttachmentOption((option) => option.setName("file").setDescription("The file of the emoji").setRequired(false));

const findEmoji = async (name: string) => {
    return readdirSync(permPath)
        .concat(readdirSync(cycPath))
        .find((emoji) => emoji.match(new RegExp(name + ".((png)|(jpeg)|(gif))", "i")));
};

addD20SlashCommand(command, async (interaction) => {
    try {
        let emoji = interaction.options.getString("emoji", true);
        console.log(emoji);
        let match = emoji.match(/<:(.+?):[0-9]+?>/g);
        if (!match) {
            interaction.reply("Invalid emoji");
            return;
        }
        let any_found = false;
        for (let emoji of match) {
            let emojiName = emoji.match(/<:(.+?):[0-9]+?>/)![1];
            await interaction.reply("Looking for " + emojiName);
            let path = await findEmoji(emojiName);
            if (path && existsSync(path)) {
                await interaction.editReply("Removing " + emojiName);
                console.log("Removing " + path);
                any_found = true;
                rmSync(path);
                // await gitAddAsync(path);
                await gitCommitAsync("Removed " + path);
                await gitPushAsync("remote", "master");
                await interaction.editReply("Removed " + path);
            } else await interaction.editReply("Couldn't find " + emojiName);
        }
        const r = interaction.replied || interaction.deferred ? interaction.editReply : interaction.reply;
        if (!any_found) await r("Couldn't find any emojis");
        else await r("Done!");
    } catch (err) {
        console.error(err);
        if (interaction.replied || interaction.deferred) interaction.editReply("Something went wrong...");
        else interaction.reply("Something went wrong...");
    }
});

import { CacheType, CommandInteraction, Guild, GuildMember, Message, MessageActionRow, MessageButton, MessageSelectMenu } from "discord.js";
import { database, testing } from "../..";
import { clients, d20 } from "../../clients";
import { say } from "../../common/functions";
import { ignore_channels, testGuildId } from "../../common/variables";
import { bankick, generatecard, mute_unmute, prestige, warn } from "../../d20/functions";
import { followup, reply } from "./common";
import { SlashCommandBuilder } from "@discordjs/builders";
import { changeTestChannel } from "../../commands/Test";

const _commands: { name: string; callback: (interaction: CommandInteraction<CacheType>) => Promise<void> }[] = [];

const addCommandToGuild = async (guild: Guild, command: SlashCommandBuilder) => {
    let commands = await guild.commands.fetch();
    commands.delete(command.name);
    guild.commands.create(command.toJSON());
};

export const addD20SlashCommand = async (command: SlashCommandBuilder, callback: (interaction: CommandInteraction<CacheType>) => Promise<void>) => {
    console.log("Adding " + command.name + " command");
    if (testing) {
        let guild = await d20.guilds.fetch(testGuildId);
        addCommandToGuild(guild, command);
    } else {
        let guilds = await d20.guilds.fetch();
        for (let guild of guilds.values()) await addCommandToGuild(await guild.fetch(), command);
    }

    _commands.push({
        name: command.name,
        callback,
    });
};

d20.on("ready", async () => {
    console.log("D20 is processing slash commands");
});
d20.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;
    if (ignore_channels.includes(interaction.channelId)) {
        reply(interaction, "Try another channel", true);
        return;
    }

    if (interaction.commandName == "test") {
        await changeTestChannel(interaction);
        return;
    }

    if (testing && interaction.channelId != testGuildId) return;
    else if (!testing && interaction.channelId == testGuildId) return;

    switch (interaction.commandName) {
        case "mute":
        case "unmute":
            mute_unmute(interaction);
            break;
        case "card":
            try {
                let card = await generatecard(interaction);
                reply(interaction, { files: [card] });
            } catch (er) {
                console.error(er);
                reply(interaction, "Something went wrong...");
            }
            break;
        case "ban":
        case "kick":
            bankick(interaction, interaction.commandName);
            break;
        case "prestige":
            prestige(interaction);
            break;
        case "help":
        case "announce":
            let channel = interaction.options.get("target-channel")?.channel?.id;
            if (!channel) channel = "624774782180917278";
            let botName = interaction.options.get("bot")?.value;
            if (typeof botName != "string" || !interaction.channel) {
                reply(interaction, "Something went wrong", true);
                return;
            }
            let bot = clients[botName];
            reply(interaction, "Waiting for message...", true);
            let collected = (await interaction.channel.awaitMessages({ time: 60000, max: 1 })).first();
            if (!collected || !(collected instanceof Message)) {
                reply(interaction, "Failed collection", true);
                return;
            }
            let content = collected.content;
            let attachments = Array.from(collected.attachments.values());
            say(bot, channel, { content: content, files: attachments });
            followup(interaction, "Announced!", true);
            break;
        case "warn": {
            let reason = interaction.options.get("reason")?.value;
            let player = interaction.options.get("player")?.member;

            if (!(interaction.member instanceof GuildMember) || !(player instanceof GuildMember)) return;

            if (!interaction.member.permissions.has("KICK_MEMBERS") && !player.permissions.has("KICK_MEMBERS")) {
                reply(interaction, "You can' do that", true);
                return;
            }

            if (!reason || !(typeof reason == "string") || !interaction.guildId || !interaction.channel) {
                reply(interaction, "Something went wrong", true);
                return;
            }
            warn(player, interaction.guildId, reason, interaction);
            break;
        }
        case "unwarn": {
            if (!(interaction.member instanceof GuildMember)) return;
            if (!interaction.member.permissions.has("KICK_MEMBERS")) {
                reply(interaction, "You can' do that", true);
                return;
            }

            let player = interaction.options.get("player")?.member;

            if (!player || !(player instanceof GuildMember) || !interaction.guildId || !interaction.channel) {
                reply(interaction, "Something went wrong", true);
                return;
            }

            let warnings = (await (await database.child(`warnings/${interaction.guildId}/${player.id}`).once("value")).val()) ?? {};
            if (Array.isArray(warnings)) warnings = Object.fromEntries(warnings.map((v, i) => [i, v]));
            let keys = Object.keys(warnings);
            if (keys.length == 0) {
                reply(interaction, "This player has no warnings!", true);
                return;
            }

            // console.log(warnings);
            let components = [
                new MessageActionRow().addComponents(
                    new MessageSelectMenu()
                        .setCustomId(`unwarn?guild=${interaction.guildId}&user=${player.id}`)
                        .setOptions(keys.slice(0, 25).map((v) => ({ label: warnings[v], value: v })))
                ),
            ];
            if (keys.length > 25)
                components.push(
                    new MessageActionRow().addComponents(new MessageButton().setCustomId("next_unwarn?page=2").setLabel("More").setStyle("PRIMARY"))
                );

            interaction.reply({
                components,
                content: "Select the warnings to remove",
                // ephemeral: true,
            });

            // if (!warnings || typeof warnings != "object") {
            //     warnings = [];
            //     database.child(`warnings/${interaction.guildId}/${player.id}`).set(warnings);
            //     reply(interaction, "This player has no warnings!", true);
            //     return;
            // }

            // let i;
            // let reason = "";
            // for (i = 0; i <= end - start; i++) {
            //     // console.log(warnings, start, warnings[start]);
            //     reason += warnings.splice(start, 1) + "\n";
            // }

            // database.child(`warnings/${interaction.guildId}/${player.id}`).set(warnings);
            // interaction.reply(
            //     `Removed ${i} warnings from ${player.user.username}\nRemoved\n\`\`\`${reason}\`\`\`\nThey have ${warnings.length} warnings left`
            // );

            break;
        }
        case "warnings": {
            let player = interaction.options.get("player")?.member;
            if (!player || !(player instanceof GuildMember)) {
                reply(interaction, "Something went wrong", true);
                return;
            }
            let warnings = (await (await database.child(`warnings/${interaction.guildId}/${player.id}`).once("value")).val()) ?? [];
            // if (!warnings || typeof warnings != "object") warnings = {};
            if (!Array.isArray(warnings)) warnings = Object.values(warnings);
            let text = `${player.user.username} has ${warnings.length} warnings`;
            if (warnings.length > 0) {
                text += "```";
                for (let w in warnings) text += `\n${parseInt(w) + 1}: ${warnings[parseInt(w)]}`;
                text += "```";
            }
            reply(interaction, text, true);
            break;
        }
        default:
            for (let { name, callback } of _commands) {
                if (name == interaction.commandName) {
                    await callback(interaction);
                    return;
                }
            }
            interaction.reply({ ephemeral: true, content: "The command /" + interaction.commandName + " has not been implemented" });
            break;
    }
});

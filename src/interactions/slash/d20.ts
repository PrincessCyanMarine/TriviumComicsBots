import { GuildMember, Message } from "discord.js";
import { database, testing } from "../..";
import { clients, d20 } from "../../clients";
import { say } from "../../common/functions";
import { ignore_channels } from "../../common/variables";
import { bankick, generatecard, mute_unmute, prestige, warn } from "../../d20/functions";
import { followup, reply } from "./common";

d20.on("ready", async () => {
    console.log("D20 is processing slash commands");
});
d20.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;
    if (ignore_channels.includes(interaction.channelId)) {
        reply(interaction, "Try another channel", true);
        return;
    }
    if (testing && interaction.channelId != "892800588469911663") return;
    else if (!testing && interaction.channelId == "892800588469911663") return;

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
        case "unwarn":
            let start = interaction.options.get("warning_start")?.value;
            let end = interaction.options.get("warning_end")?.value;
            let player = interaction.options.get("player")?.member;
            if (typeof start == "number") start--;
            else start = -1;
            if (typeof end == "number") end--;
            else end = start;

            if (!(interaction.member instanceof GuildMember)) return;
            if (!interaction.member.permissions.has("KICK_MEMBERS")) {
                reply(interaction, "You can' do that", true);
                return;
            }
            if (
                !player ||
                !(player instanceof GuildMember) ||
                !(typeof start == "number") ||
                !(typeof end == "number") ||
                !interaction.guildId ||
                !interaction.channel
            ) {
                reply(interaction, "Something went wrong", true);
                return;
            }

            let warnings = await (await database.child(`warnings/${interaction.guildId}/${player.id}`).once("value")).val();
            if (!warnings || typeof warnings != "object") {
                warnings = [];
                database.child(`warnings/${interaction.guildId}/${player.id}`).set(warnings);
                reply(interaction, "This player has no warnings!", true);
                return;
            }

            let i;
            let reason = "";
            for (i = 0; i <= end - start; i++) {
                // console.log(warnings, start, warnings[start]);
                reason += warnings.splice(start, 1) + "\n";
            }

            database.child(`warnings/${interaction.guildId}/${player.id}`).set(warnings);
            interaction.reply(
                `Removed ${i} warnings from ${player.user.username}\nRemoved\n\`\`\`${reason}\`\`\`\nThey have ${warnings.length} warnings left`
            );

            break;
        case "warnings": {
            let player = interaction.options.get("player")?.member;
            if (!player || !(player instanceof GuildMember)) {
                reply(interaction, "Something went wrong", true);
                return;
            }
            let warnings = await (await database.child(`warnings/${interaction.guildId}/${player.id}`).once("value")).val();
            if (!warnings || typeof warnings != "object") warnings = [];
            let text = `${player.user.username} has ${warnings.length} warnings`;
            if (warnings.length > 0) {
                text += "```";
                for (let w in warnings) text += `\n${parseInt(w) + 1}: ${warnings[parseInt(w)]}`;
                text += "```";
            }
            reply(interaction, text);
            break;
        }
        default:
            reply(interaction, "Sorry, I don't know that command", true);
            break;
    }
});

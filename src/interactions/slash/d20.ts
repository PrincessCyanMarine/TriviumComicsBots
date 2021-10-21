import { GuildMember, Message } from "discord.js";
import { database, testing } from "../..";
import { clients, d20 } from "../../clients";
import { command_list, command_list_string } from "../../commandlist";
import { say } from "../../common/functions";
import { ignore_channels } from "../../common/variables";
import { bankick, generatecard, prestige } from "../../d20/function";
import { followup, reply } from "./common";

d20.on('ready', async () => {
    console.log("D20 is processing slash commands");
})
d20.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;
    if (ignore_channels.includes(interaction.channelId)) { reply(interaction, 'Try another channel', true); return; }
    if (testing && interaction.channelId != '892800588469911663') return;
    else if (!testing && interaction.channelId == '892800588469911663') return;

    switch (interaction.commandName) {
        case "card":
            interaction.deferReply();
            try {
                let card = await generatecard(interaction);
                reply(interaction, { files: [card] });
            } catch (er) {
                console.error(er);
                reply(interaction, 'Something went wrong...');
            }
            break;
        case "ban":
        case "kick":
            bankick(interaction, interaction.commandName);
            break;
        case "prestige":
            prestige(interaction);
            break;
        case 'help':
            let commandlisttext = `Commands\nKrystal:\n\`\`\`${command_list.Krystal.join(', ')}\`\`\`\nSadie:\n\`\`\`${command_list.sadie.join(', ')}\`\`\`\nD20:\n\`\`\`${command_list.d20.join(', ')}\`\`\`\nMultiple\n\`\`\`${command_list.multiple.join(', ')}\`\`\``;
            let command = interaction.options.get('command')?.value;
            console.log(command_list_string);
            if (
                !command ||
                typeof command != 'string' ||
                !(command.match(command_list_string))
            ) { reply(interaction, commandlisttext, true); return; };
            { reply(interaction, `Here's how that command works: https://github.com/PrincessCyanMarine/TriviumComicsBots/wiki/${command.replace(/\s/g, '_')}`); return; };
        case 'announce':
            let channel = interaction.options.get('target-channel')?.channel?.id;
            if (!channel) channel = '624774782180917278';
            let botName = interaction.options.get('bot')?.value;
            if (typeof botName != 'string' || !interaction.channel) { reply(interaction, 'Something went wrong', true); return; };
            let bot = clients[botName];
            reply(interaction, "Waiting for message...", true);
            let collected = (await interaction.channel.awaitMessages({ time: 60000, max: 1 })).first();
            if (!collected || !(collected instanceof Message)) { reply(interaction, 'Failed collection', true); return; };
            let content = collected.content;
            let attachments = Array.from(collected.attachments.values());
            say(bot, channel, { content: content, files: attachments });
            followup(interaction, "Announced!", true);
            break;
        case 'warn': {
            let reason = interaction.options.get('reason')?.value;
            let player = interaction.options.get('player')?.member;

            if (!interaction.guild?.members.cache.get(interaction.user.id)?.permissions.has('KICK_MEMBERS')) { reply(interaction, 'You can\' do that', true); return; };
            if (!player || !(player instanceof GuildMember) || !reason) { reply(interaction, 'Something went wrong', true); return; };

            let warnings = await (await database.child(`warnings/${interaction.guildId}/${player.id}`).once('value')).val();
            if (!warnings || typeof warnings != 'object') warnings = [];
            warnings.push(reason);
            database.child(`warnings/${interaction.guildId}/${player.id}`).set(warnings);
            reply(interaction, `${player.user.username} has been warned for ${reason}\nThey have ${warnings.length} warnings`);
            break;
        }
        case 'warnings': {
            let player = interaction.options.get('player')?.member;
            if (!player || !(player instanceof GuildMember)) { reply(interaction, 'Something went wrong', true); return; };
            let warnings = await (await database.child(`warnings/${interaction.guildId}/${player.id}`).once('value')).val();
            if (!warnings || typeof warnings != 'object') warnings = [];
            let text = `${player.user.username} has ${warnings.length} warnings`;
            if (warnings.length > 0) {
                text += '```';
                for (let w in warnings) text += `\n${parseInt(w) + 1}: ${warnings[parseInt(w)]}`;
                text += '```';
            }
            reply(interaction, text);
            break;
        }
        default:
            reply(interaction, 'Sorry, I don\'t know that command', true);
            break;
    }
});
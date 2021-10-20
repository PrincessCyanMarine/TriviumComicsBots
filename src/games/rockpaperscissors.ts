import { userMention } from "@discordjs/builders";
import { ButtonInteraction, GuildChannel, GuildMember, Message, MessageActionRow, MessageButton, MessageSelectMenu, SelectMenuInteraction } from "discord.js";
import { testing } from "..";
import { clients, d20, krystal, ray } from "../clients";
import { RayId, testGuildId, triviumGuildId } from "../common/variables";
import { get_rps_interactible, reply, update } from "./common";

Object.values(clients).forEach(bot => {
    bot.on('interactionCreate', async (interaction) => {
        if (!((interaction instanceof SelectMenuInteraction) || (interaction instanceof ButtonInteraction))) return;
        if (testing && interaction.channelId != '892800588469911663') return;
        else if (!testing && interaction.channelId == '892800588469911663') return;

        if (interaction.customId.includes('rpssp')) return handleSelectMenu(interaction);
        if (interaction.customId.includes("Remove-")) {
            if (interaction.user.id != interaction.customId.split('Remove-')[1]) return interaction.reply({ content: 'You can\'t do that', ephemeral: true });
            if (!(interaction.message instanceof Message)) return
            // console.log(interaction.message.interaction);
            interaction.message.edit({ content: interaction.message.content.replace('Play again?', ''), components: [] })
        }
    });
});

const RpsValues: { [choice: string]: number } = {
    "rock": 0,
    "paper": 1,
    "scissors": 2
}

const RockPaperScissorTable = [
    ["DRAW", "PLAYER_LOST", "PLAYER_WON"],
    ["PLAYER_WON", "DRAW", "PLAYER_LOST"],
    ["PLAYER_LOST", "PLAYER_WON", "DRAW"],
]

function handleSelectMenu(interaction: SelectMenuInteraction | ButtonInteraction) {
    if (interaction.customId.includes('rpssp')) {
        let playerId = interaction.customId.split('rpssp-')[1].split('/')[0];
        // console.log(playerId, interaction.user.id, interaction.user.id == playerId);

        let choice_name;
        if (interaction instanceof SelectMenuInteraction)
            choice_name = interaction.values[0];
        else
            choice_name = interaction.customId.split('/')[1];

        let choice = RpsValues[choice_name];

        // console.log(choice);

        let pc = Math.floor(Math.random() * RockPaperScissorTable.length);
        if (interaction.message.author.id == RayId) pc = 0;
        else if (interaction.message.author.id == d20.user?.id) pc = (choice + 1) % RockPaperScissorTable.length;
        let result = RockPaperScissorTable[choice][pc];

        let text = `${userMention(interaction.user.id)} chose ${choice_name}\n`;
        text += `${userMention(interaction.message.author.id)} chose ${["rock", "paper", "scissors"][pc]}\n\n`;
        text += result == "DRAW" ? 'It\'s a draw!\n' :
            `${result == "PLAYER_WON" ? userMention(interaction.user.id) :
                userMention(interaction.message.author.id)} won!\n`;
        text += '\nPlay again?'


        if (interaction.user.id != playerId) {
            let rps_interactible = get_rps_interactible(interaction.user.id, interaction instanceof SelectMenuInteraction, true);
            // console.log(rps_interactible)
            interaction.reply({
                content: text, ephemeral: true, components: [
                    new MessageActionRow().addComponents(rps_interactible)
                ]
            });
        }
        else {
            let components = interaction.message.components?.map(c => c instanceof MessageActionRow ? c : new MessageActionRow);
            console.log(interaction.message instanceof Message && interaction.message.deletable)
            console.log(interaction.customId)
            if (components?.length == 1 && !interaction.customId.startsWith('a'))
                components.push(new MessageActionRow().addComponents(
                    new MessageButton()
                        .setCustomId('Remove-' + playerId)
                        .setLabel('Remove')
                        .setStyle('DANGER')
                        .setEmoji("✖️")
                ))
            update(interaction, { content: text, components: components });
        }
    }
}

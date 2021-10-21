import { userMention } from "@discordjs/builders";
import { ButtonInteraction, Message, MessageActionRow, MessageButton, SelectMenuInteraction } from "discord.js";
import { testing } from "..";
import { clients, d20, id2bot } from "../clients";
import { RayId } from "../common/variables";
import { get_rps_interactible, update } from "./common";

Object.values(clients).forEach(bot => {
    bot.on('interactionCreate', async (interaction) => {
        if (!((interaction instanceof SelectMenuInteraction) || (interaction instanceof ButtonInteraction))) return;
        if (testing && interaction.channelId != '892800588469911663') return;
        else if (!testing && interaction.channelId == '892800588469911663') return;

        if (interaction.customId.includes('rpssp')) return handleSelectMenu(interaction);
        else if (interaction.customId.includes("Remove-")) {
            if (interaction.user.id != interaction.customId.split('Remove-')[1]) return interaction.reply({ content: 'You can\'t do that', ephemeral: true });
            if (!(interaction.message instanceof Message)) return
            // console.log(interaction.message.interaction);
            interaction.message.edit({ content: interaction.message.content.replace('Play again?', ''), components: [] })
        }
        else if (interaction.customId.includes("Continue-")) {
            let text = rockpaperscissors_messages.challenged[bot_enum[id2bot[interaction.message.author.id]]];
            if (interaction.user.id != interaction.customId.split('Continue-')[1])
                return sendtoplayer(interaction, text);
            update(interaction, {
                content: text,
                components: [
                    new MessageActionRow()
                        .addComponents(get_rps_interactible(interaction.user.id, interaction.customId.startsWith('a')))
                ]
            });
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

export const bot_enum: { [bot: string]: number } = {
    "krystal": 0,
    "eli": 1,
    "sadie": 2,
    "ray": 3,
}
export const rockpaperscissors_messages: { [moment: string]: { [bot: string]: string } } = {
    challenged: {
        0: "I do not understand the game, But I will try my best.",
        1: "Are we playing for a waifu?",
        2: "Oh-Ho! You're approaching me?",
        3: "Alright, I'll play with you. But you should know, I have a flawless strategy!",
    },
    draw: {},
    //TODO Ray coma
    lose: {},
    win: {}
}
function handleSelectMenu(interaction: SelectMenuInteraction | ButtonInteraction) {
    if (interaction.customId.includes('rpssp')) {
        let playerId = interaction.customId.split('rpssp-')[1].split('/')[0];
        // console.log(playerId, interaction.user.id, interaction.user.id == playerId);

        if (interaction.user.id != playerId) return sendtoplayer(interaction, rockpaperscissors_messages.challenged[bot_enum[id2bot[interaction.message.author.id]]]);

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

        //TODO Krystal
        // if (interaction.message.author.id == krystalId) {
        //     [
        //         () => { },
        //         () => { },
        //         () => { },
        //     ][pc]();
        //     return;
        // };

        let text = `${userMention(interaction.user.id)} chose ${choice_name}\n`;
        text += `${userMention(interaction.message.author.id)} chose ${["rock", "paper", "scissors"][pc]}\n\n`;
        text += result == "DRAW" ? 'It\'s a draw!\n' :
            `${result == "PLAYER_WON" ? userMention(interaction.user.id) :
                userMention(interaction.message.author.id)} won!\n`;


        let components = interaction.message.components?.map(c => c instanceof MessageActionRow ? c : new MessageActionRow);
        // console.log(interaction.message instanceof Message && interaction.message.deletable)
        // console.log(interaction.customId)
        if (!interaction.customId.startsWith('a')) {
            components = [new MessageActionRow().addComponents(
                new MessageButton()
                    .setCustomId(`${interaction instanceof SelectMenuInteraction ? 'a' : ''}Continue-${playerId}`)
                    .setLabel('Yes')
                    .setStyle('SUCCESS')
                    .setEmoji("✔️"),
                new MessageButton()
                    .setCustomId('Remove-' + playerId)
                    .setLabel('No')
                    .setStyle('DANGER')
                    .setEmoji("✖️"),
            )];

            text += '\nPlay again?'
        } else
            components = [];
        update(interaction, { content: text, components: components });
    }
}


function sendtoplayer(interaction: ButtonInteraction | SelectMenuInteraction, text: string) {
    let rps_interactible = get_rps_interactible(interaction.user.id, interaction instanceof SelectMenuInteraction, true);
    // console.log(rps_interactible)
    interaction.reply({
        content: text, ephemeral: true, components: [
            new MessageActionRow().addComponents(rps_interactible)
        ]
    });
}
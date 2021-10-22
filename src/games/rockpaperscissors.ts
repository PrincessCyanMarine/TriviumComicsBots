import { userMention } from "@discordjs/builders";
import { ButtonInteraction, GuildMember, Message, MessageActionRow, MessageButton, MessageEmbed, SelectMenuInteraction, TextBasedChannels, TextChannel } from "discord.js";
import { testing } from "..";
import { clients, d20, id2bot } from "../clients";
import emojis from "../common/emojis";
import { random_from_array, say } from "../common/functions";
import { krystalId, RayId } from "../common/variables";
import { burning, eating, killing } from "../krystal/functions";
import { get_rps_interactible, reply, update } from "./common";

Object.values(clients).forEach(bot => {
    bot.on('interactionCreate', async (interaction) => {
        if (!((interaction instanceof SelectMenuInteraction) || (interaction instanceof ButtonInteraction))) return;
        if (testing && interaction.channelId != '892800588469911663') return;
        else if (!testing && interaction.channelId == '892800588469911663') return;

        // play-against=${b}&id=${msg.author.id}
        // console.log(interaction.customId);
        if (interaction instanceof SelectMenuInteraction && interaction.customId == 'play-against-list') interaction.customId = interaction.values[0];

        let challeging = interaction.customId.match(/play-against=(?<bot>.+?)&id=(?<player_id>.+?)&list=(?<list>[01])/i);
        if (challeging && challeging.groups && interaction.channel?.isText()) {
            interaction.deferUpdate();
            let bot_name = challeging.groups.bot;
            let player_id = challeging.groups.player_id;
            if (interaction.user.id != player_id) {
                sendtoplayer(interaction, rockpaperscissors_messages.challenged[bot_name]);
                return;
            }

            let list = challeging.groups.list == "1";
            if (interaction.message instanceof Message) interaction.message.delete().catch(console.error);
            playrps(bot_name, player_id, interaction.channel, list);
        }

        if (interaction.customId.includes('rpssp')) return handleSelectMenu(interaction);
        else if (interaction.customId.includes("Remove-")) {
            if (interaction.user.id != interaction.customId.split('Remove-')[1]) return interaction.reply({ content: 'You can\'t do that', ephemeral: true });
            if (!(interaction.message instanceof Message)) return
            // console.log(interaction.message.interaction);
            interaction.message.edit({ content: interaction.message.content.replace('Play again?', ''), components: []/* , embeds: [] */ })
        }
        else if (interaction.customId.includes("Continue-")) {
            let text = rockpaperscissors_messages.challenged[id2bot[interaction.message.author.id]];
            if (interaction.user.id != interaction.customId.split('Continue-')[1])
                return sendtoplayer(interaction, text);
            interaction.update({
                content: text,
                components: [
                    new MessageActionRow()
                        .addComponents(get_rps_interactible(interaction.user.id, interaction.customId.startsWith('a')))
                ], embeds: []
            });
        }
    });
});

export function playrps(bot_name: string, id: string, channel: TextBasedChannels, list: boolean = false, wrongplayer: boolean = false) {
    bot_name = bot_name.toLowerCase();
    if (bot_name == "random")
        bot_name = random_from_array(rps_bots.slice(0, rps_bots.length - 1));
    let bot = clients[bot_name];

    let method = get_rps_interactible(id, list);
    say(bot, channel, {
        content: rockpaperscissors_messages["challenged"][bot_name],
        components: [new MessageActionRow().addComponents(method)]
    }, 100);
}

export const rps_bots = ["ray", "sadie", "krystal", "eli", "random"];
export const rps_bots_emojis: { [bot: string]: string } = {
    "ray": emojis[":GMRayFakRight:"],
    "sadie": emojis[":GMSadieTheSadist:"],
    "krystal": emojis[":GMKrystalTongue:"],
    "eli": emojis[":GMEliPopcorn3:"],
    "random": emojis[":GMPopcorn:"],
};

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

export const rockpaperscissors_messages: { [key: string]: { [key: string]: string } } = {
    challenged: {
        "krystal": "I do not understand the game, But I will try my best.",
        "eli": "Are we playing for a waifu?",
        "sadie": "Oh-Ho! You're approaching me?",
        "ray": "Alright, I'll play with you. But you should know, I have a flawless strategy!",
    },
    PLAYER_WON: {
        "eli": "Well played.",
        "sadie": "Eh, Don't care. My boobs still big.",
        /*
            TODO Ray coma
            TODO "Huh!? No! Impossible! This is bull! HOW COULD I LOS-"
            TODO Image is send with Ray in the salt coma with text above it that reads
            TODO "Ray has entered a Salt coma."
            TODO In which case he won't respond to messages or challenges for five minutes, Unless he's woken up by certain key words, Which will be mentioned later.

            TODO Ray should also go into a salt coma when the following is mentioned:
            TODO "Sonic Adventure 3/three will never come out/release/be made."

            TODO Keywords to wake Ray up.
            TODO "Sonic Adventure 3/Three is out"
            TODO "Dank Magician is good/meta now"

            TODO In which case an image of Ray sitting up in the Hospital bed will be sent as he says "Real shit?"

            TODO If the next message is then "Just kidding." "no." "not." etc. another image will be sent with him going back into the salt coma as he says "I'm going back in."
        */
        "ray": "Huh!? No! Impossible! This is bull! HOW COULD I LOSE?!",
    },
    PLAYER_LOST: {
        "krystal": "",
        "eli": "I WON'T LET YOU HAVE YOUR IMPURE WAYS WITH MY NEWLY FOUND WAIFU!",
        "sadie": "Ha! Just like I thought.",
        "ray": "Good ol' Rock, Never fails.",

    }
}
async function handleSelectMenu(interaction: SelectMenuInteraction | ButtonInteraction) {
    if (interaction.customId.includes('rpssp')) {
        let playerId = interaction.customId.split('rpssp-')[1].split('/')[0];
        // console.log(playerId, interaction.user.id, interaction.user.id == playerId);

        if (interaction.user.id != playerId) return sendtoplayer(interaction, rockpaperscissors_messages.challenged[id2bot[interaction.message.author.id]]);

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
        if (interaction.message.author.id == krystalId) {
            let embed = new MessageEmbed()
                .setAuthor("The Cosmic D20", "https://cdn.discordapp.com/avatars/743606862578057277/86f4b6b4075938799f679e80f75634ab.png?size=1024")
                .addField(interaction.member && interaction.member instanceof GuildMember ? interaction.member.displayName : interaction.user.username, choice_name)
                .addField("Krystal", ["popcorn...?", "gun...?", "fireball...?"][pc])
                .addField("Result", "Krystal wins... Somehow...")
                .setColor('RED');
            let file = [
                () => eating(undefined, interaction.user),
                () => killing(undefined, interaction.user),
                () => burning(undefined),
            ][pc];

            interaction.update({
                embeds: [embed],
                files: [await file()],
                components: []
            })

            return;
        };

        // let text = `${userMention(interaction.user.id)} chose ${choice_name}\n`;
        // text += `${userMention(interaction.message.author.id)} chose ${["rock", "paper", "scissors"][pc]}\n\n`;

        let components = interaction.message.components?.map(c => c instanceof MessageActionRow ? c : new MessageActionRow);
        // console.log(interaction.message instanceof Message && interaction.message.deletable)
        // console.log(interaction.customId)
        // if (!interaction.customId.startsWith('a')) {
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

        // text += '\nPlay again?'
        // } else
        //     components = [];

        let bot_name = id2bot[interaction.message.author.id];

        let embed = new MessageEmbed()
            .setAuthor("The Cosmic D20", "https://cdn.discordapp.com/avatars/743606862578057277/86f4b6b4075938799f679e80f75634ab.png?size=1024")
            .addField(interaction.member && interaction.member instanceof GuildMember ? interaction.member.displayName : interaction.user.username, choice_name)
            .addField(bot_name, ["rock", "paper", "scissors"][pc])
            .addField("Result", result == "DRAW" ? 'It\'s a draw!\n' : `${result == "PLAYER_WON" ? userMention(interaction.user.id) : userMention(interaction.message.author.id)} won!\n`)
            .setColor(result == "DRAW" ? "YELLOW" : result == "PLAYER_WON" ? "GREEN" : "RED");


        interaction.update({ embeds: [embed], content: rockpaperscissors_messages[result == "DRAW" ? "PLAYER_WON" : result][bot_name] + "\nPlay again?", components: components });
    }
}


function sendtoplayer(interaction: ButtonInteraction | SelectMenuInteraction, text: string) {
    let rps_interactible = get_rps_interactible(interaction.user.id, interaction instanceof SelectMenuInteraction, true);
    // console.log(rps_interactible)
    interaction.followUp({
        content: text, ephemeral: true, components: [
            new MessageActionRow().addComponents(rps_interactible)
        ]
    });
}
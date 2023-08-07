import {
    Channel,
    GuildMember,
    MessageActionRow,
    MessageEmbed,
    Permissions,
    InteractionUpdateOptions,
    Message,
    MessageButton,
    MessageSelectMenu,
    Modal,
    ModalActionRowComponent,
    ModalActionRowComponentResolvable,
    TextInputComponent,
    ButtonInteraction,
} from "discord.js";
import { database, testing } from "../..";
import { d20, krystal, mod_alert_webhook } from "../../clients";
import { colors, testChannelId, triviumGuildId } from "../../common/variables";
import {
    ActionRowBuilder,
    userMention,
    AnyAPIActionRowComponent,
    ModalActionRowComponentBuilder,
    ModalBuilder,
    TextInputBuilder,
} from "@discordjs/builders";
import { MessageTypes } from "discord.js/typings/enums";
import { getCardStyle, sendCardCustomizationMessage, setCardStyle } from "../../common/functions";
import { TextInputStyles } from "discord.js/typings/enums";
import { defaultstyle, isCardCustomizationMessageFromUser } from "../../d20/functions";

const _commands: { names: string[]; callback: (interaction: ButtonInteraction) => Promise<void> }[] = [];
export const addD20ButtonCommand = (names: string | string[], callback: (interaction: ButtonInteraction) => Promise<void>) => {
    if (!Array.isArray(names)) names = [names];
    _commands.push({
        names,
        callback,
    });
};

d20.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;
    if (testing && interaction.channelId != testChannelId) return;
    else if (!testing && interaction.channelId == testChannelId) return;
    // console.log(interaction.customId);

    let ignore = ["play-against"];
    for (let command of ignore) if (interaction.customId.startsWith(command)) return;

    if (interaction.customId.startsWith("unwarn")) {
        if (!interaction.member) return interaction.reply("You must be in a server to use this button");
        // if (!interaction.memberPermissions?.has(Permissions.FLAGS.KICK_MEMBERS))
        //     return interaction.reply("You must have kick members permission to use this button");
        let match = interaction.customId.match(/unwarn\?guild=(.+?)&user=(.+?)&key=(.+)/);
        if (!match) return;
        let [_, guildId, userId, key] = match;
        // console.log(interaction.customId, guildId, userId, key);
        await database.child("warnings").child(guildId).child(userId).child(key).remove();

        let msg = interaction.message;
        let components = msg.components
            ?.map((_c) => {
                if (_c.type == "ACTION_ROW") {
                    let actionrow = new MessageActionRow();
                    actionrow.setComponents(_c.components.filter((c) => c.customId != interaction.customId));
                    return actionrow;
                }
                return undefined;
            })
            .filter((c) => !!c) as MessageActionRow[];
        let embeds = msg.embeds;

        embeds[embeds.length - 1] = new MessageEmbed(embeds[embeds.length - 1])
            .setColor("GREEN")
            .addFields({ name: "Resolved", value: "Warning removed by " + interaction.user.tag });
        await mod_alert_webhook(testing).editMessage(msg.id, {
            components,
            embeds,
        });
        interaction.reply(`${userMention(interaction.user.id)} removed this warning`);
    }

    switch (interaction.customId) {
        case "card_title": {
            if (isCardCustomizationMessageFromUser(interaction)) return;
            let style = await getCardStyle(interaction.user.id);
            let modal = new Modal().setTitle("TITLE").setCustomId("card_title");
            let textInput = new TextInputComponent()
                .setCustomId("title")
                .setPlaceholder("Your title goes here!")
                .setMinLength(1)
                .setMaxLength(50)
                .setRequired(true)
                .setStyle(TextInputStyles.SHORT as number)
                .setLabel("Title");
            if (style.title) textInput.setValue(style.title);
            let actionRow = new MessageActionRow() as MessageActionRow<ModalActionRowComponent>;
            actionRow.addComponents(textInput);
            modal.addComponents(actionRow);
            await interaction.showModal(modal);
            break;
        }
        case "card_colors": {
            if (isCardCustomizationMessageFromUser(interaction)) return;

            let style = await getCardStyle(interaction.user.id);
            console.log(style);
            let modal = new Modal().setTitle("XP BAR COLORS").setCustomId("card_colors");
            let colorAInput = new TextInputComponent()
                .setCustomId("color_a")
                .setPlaceholder("Your first color goes here!")
                .setMinLength(6)
                .setMaxLength(7)
                .setRequired(true)
                .setStyle(TextInputStyles.SHORT as number)
                .setValue(style.color || defaultstyle["color"])
                .setLabel("Color A");
            let colorBInput = new TextInputComponent()
                .setCustomId("color_b")
                .setPlaceholder("Your other color goes here!")
                .setMinLength(0)
                .setMaxLength(7)
                .setRequired(false)
                .setStyle(TextInputStyles.SHORT as number)
                .setValue(style.color2 || "")
                .setLabel("Color B");
            let actionRowA = new MessageActionRow() as MessageActionRow<ModalActionRowComponent>;
            actionRowA.addComponents(colorAInput);
            let actionRowB = new MessageActionRow() as MessageActionRow<ModalActionRowComponent>;
            actionRowB.addComponents(colorBInput);
            modal.addComponents(actionRowA, actionRowB);
            await interaction.showModal(modal);
            break;
        }
        case "card_mode":
        case "xp_mode": {
            let value = interaction.customId == "card_mode" ? true : false;
            if (isCardCustomizationMessageFromUser(interaction)) return;
            await sendCardCustomizationMessage(interaction, false, undefined, undefined, value);
            break;
        }
        default:
            for (let { names, callback } of _commands) {
                if (names.includes(interaction.customId.split("?")[0])) {
                    await callback(interaction);
                    return;
                }
            }
            interaction.reply({ ephemeral: true, content: "The command " + interaction.customId.split("?")[0] + " has not been implemented" });
            break;
    }

    if (interaction.customId.startsWith("card_previous")) {
        if (isCardCustomizationMessageFromUser(interaction)) return;
        let query_string = interaction.customId.split("?")[1];
        let params = new URLSearchParams(query_string);
        let style = await getCardStyle(interaction.user.id);

        await setCardStyle(interaction.user.id, {
            type: params.get("s") as string,
            color: params.get("a") as string,
            color2: params.get("b") as string,
            title: params.get("t") as string,
        });
        (await sendCardCustomizationMessage(interaction, true, style, params.has("p") ? undefined : "REDO")) as InteractionUpdateOptions;
    }
});

import { ButtonInteraction, Interaction, Message, MessageActionRow, MessageButton } from "discord.js";
import { addExclamationCommand } from "../common";
import { getMana, useMana } from "../common/functions";
import { Inventory } from "../model/inventory";
import { addD20ButtonCommand } from "../interactions/button/d20";
import { MessageButtonStyles } from "discord.js/typings/enums";

let getCost = (num: 6 | 20 | 100, ext: boolean) => {
    return (
        {
            6: 60,
            20: 75,
            100: 100,
        }[num] + (ext ? 25 : 0)
    );
};

let getButtons = (moi: Message | Interaction, options: string[], plusOne = false) => {
    let id = moi instanceof Message ? moi.author.id : moi.user.id;
    return [
        new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId(`adv6?id=${id}&plusOne=${plusOne}`)
                .setLabel(`6 (${getCost(6, plusOne)} mana)`)
                .setStyle(MessageButtonStyles.PRIMARY),
            new MessageButton()
                .setCustomId(`adv20?id=${id}&plusOne=${plusOne}`)
                .setLabel(`20 (${getCost(20, plusOne)} mana)`)
                .setStyle(MessageButtonStyles.PRIMARY),
            new MessageButton()
                .setCustomId(`adv100?id=${id}&plusOne=${plusOne}`)
                .setLabel(`100 (${getCost(100, plusOne)} mana)`)
                .setStyle(MessageButtonStyles.PRIMARY),
            new MessageButton()
                .setCustomId(`advPlusOne?id=${id}&plusOne=${plusOne}`)
                .setLabel(plusOne ? "REMOVE +1" : "ADD +1")
                .setStyle(plusOne ? MessageButtonStyles.DANGER : MessageButtonStyles.SUCCESS)
        ),
    ];
};

let advMessage = async (moi: Message | Interaction, options: string[], plusOne = false) => {
    let buttons = getButtons(moi, options, plusOne);
    let mana = await getMana(moi);
    return {
        content: `You have ${Math.floor(mana.value)}/${mana.max} mana\nChoose a die to roll${plusOne ? " (Adding +1)" : ""}`,
        components: buttons,
    };
};

let doAdventure = async (moi: Message | Interaction, num: 6 | 20 | 100, plusOne = false): Promise<[boolean, string]> => {
    let roll = Math.min(num, Math.ceil(Math.random() * num + (plusOne ? 1 : 0)));
    let cost = getCost(num, plusOne);
    let payouts = {
        6: 10,
        20: 50,
        100: 300,
    };
    let [canUse] = await useMana(moi, cost);
    if (!canUse) {
        return [false, `Not enough mana\nCost: ${cost}`];
    }
    let result = ({
        1: [`Critical fail! You lost ${payouts[num] / 2} gold!`, -payouts[num] / 2],
        5: [`You won ${payouts[6] / 2} gold!`, payouts[6] / 2],
        6: [`You won ${payouts[6]} gold!`, payouts[6]],
        15: [`You found a Shiny Rock`, 0, () => Inventory.give(moi, Inventory.ITEM_DICT["Shiny rock"], 1)],
        19: [`You won ${payouts[20] / 2} gold!`, payouts[20] / 2],
        20: [`You won ${payouts[20]} gold!`, payouts[20]],
        69: [`Nice! You won 69 gold!`, 69],
        [num - 1]: [`Almost! You won ${payouts[num] / 2} gold!`, payouts[num] / 2],
        [num]: [`Critical success! You won ${payouts[num]} gold!`, payouts[num]],
    }[roll] || [`You won nothing`, 0]) as [string, number, undefined | (() => Promise<void | any>)];
    let text = result[0];
    let pay = result[1];
    if (result[2]) await result[2]();
    if (pay != 0) await Inventory.addGold(moi, pay);
    let mana = await getMana(moi);
    return [
        true,
        `You consumed ${cost} mana (${Math.floor(mana.value)}/${mana.max}) to roll a d${num} and got a ${roll - (plusOne ? 1 : 0)}${
            plusOne ? " +1" : ""
        }\n${text}`,
    ];
};

let getId = (customId: string) => {
    return customId.match(/id=([^&]+?)(&|$)/)?.[1];
};

let canRoll = (interaction: ButtonInteraction) => interaction.user.id == getId(interaction.customId);

let roll = async (interaction: ButtonInteraction, num: 6 | 20 | 100) => {
    if (!canRoll(interaction)) {
        interaction.reply({ content: "You can't roll for someone else", ephemeral: true });
        return;
    }
    let plusOne = getPlusOne(interaction.customId);
    let [success, text] = await doAdventure(interaction, num, plusOne);
    let msg = await advMessage(interaction, interaction.customId.split("?")[1].split("&"), plusOne);
    msg.content = text;
    await interaction.update(msg);
};

addExclamationCommand(["adv", "adventure"], async (msg, options) => {
    let num = options[1];
    if (num == "6" || num == "20" || num == "100") {
        let plusOne = !!options[2];
        let [success, text] = await doAdventure(msg, parseInt(num) as 6 | 20 | 100, plusOne);
        let components = getButtons(msg, options, plusOne);
        msg.reply({ content: text, components });
        return;
    }
    msg.reply(await advMessage(msg, options));
});

let getPlusOne = (customId: string) => {
    return customId.includes("plusOne=true");
};

addD20ButtonCommand("advPlusOne", async (interaction) => {
    if (!canRoll(interaction)) {
        interaction.reply({ content: "You can't roll for someone else", ephemeral: true });
        return;
    }
    let plusOne = getPlusOne(interaction.customId);
    await interaction.update(await advMessage(interaction, interaction.customId.split("?")[1].split("&"), !plusOne));
});

addD20ButtonCommand("adv6", async (interaction) => roll(interaction, 6));
addD20ButtonCommand("adv20", async (interaction) => roll(interaction, 20));
addD20ButtonCommand("adv100", async (interaction) => roll(interaction, 100));

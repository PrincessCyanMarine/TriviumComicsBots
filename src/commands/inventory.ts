import { ButtonInteraction, Interaction, Message, MessageActionRow, MessageButton } from "discord.js";
import { Inventory } from "../model/inventory";
import { getShopButton } from "./shop";
import { addSadieButtonCommand } from "../interactions/button/sadie";
import { addExclamationCommand } from "../common";
import { sadie } from "../clients";
import { say } from "../common/functions";
import { MessageButtonStyles } from "discord.js/typings/enums";
import { randomUUID } from "crypto";

let isSameUser = (interaction: ButtonInteraction) => interaction.user.id == interaction.customId.match(/id=([^&]+?)(&|$)/)?.[1];
export const getInventoryMessage = async (moi: Message | Interaction, page = 0) => {
    let inventory = await Inventory.get(moi, moi instanceof Message ? moi.author : moi.user);
    let author = moi instanceof Message ? moi.author : moi.user;

    let content = "";

    let min = (page + 1) * 5 - 5;
    let max = Math.min((page + 1) * 5, inventory.items.length);
    if (min >= max) {
        min -= 5;
        page--;
    }
    if (min < 0) {
        min = 0;
        page = 0;
    }

    let interactionButtons = [] as MessageButton[];

    try {
        let inventoryStr = [];
        if (inventory.items.length != 0) {
            for (let i = min; i < max; i++) {
                let item = inventory.items[i];
                if (item.count == 0) continue;
                inventoryStr.push(
                    `${i}: ${item.equipped ? `(${Inventory.canUse(item) ? "active" : "equipped"}) ` : ""}[${item.rarity}] ${item.name} ${
                        item.count && item.count > 1 ? `x${item.count} ` : ``
                    }[${item.type == "armor" ? item.slot : item.type}]\n- (${item.id}) ${item.description}`
                );
                let interact = new MessageButton()
                    .setStyle(MessageButtonStyles.SECONDARY)
                    .setDisabled(true)
                    .setCustomId(`notusabledecorativebutton_${randomUUID()}`);
                if (Inventory.canEquip(item) || Inventory.canUse(item)) {
                    if (Inventory.canUse(item) && item.equipped) interact.setLabel(`ACTIVE`);
                    else {
                        interact = new MessageButton()
                            .setCustomId(`use?id=${author.id}&item=${i}&page=${page}`)
                            .setLabel(Inventory.canUse(item) ? `USE` : item.equipped ? `UNEQUIP` : `EQUIP`)
                            .setStyle(
                                Inventory.canUse(item)
                                    ? MessageButtonStyles.SUCCESS
                                    : item.equipped
                                    ? MessageButtonStyles.DANGER
                                    : MessageButtonStyles.SECONDARY
                            )
                            .setDisabled(false);
                        if (item.equipped && Inventory.ITEMS[item.id].equipped) interact.setDisabled(true);
                    }
                } else interact.setLabel(`NOT INTERACTABLE`);
                interactionButtons.push(interact);
            }
            content = `${author}'s inventory\n\`\`\`\nGold: ${inventory.gold}\n\n${inventoryStr.join("\n\n")}\n\`\`\``;
        }
    } catch (err: any) {
        console.error(err);
        content = err?.message || err || "Something went wrong";
        if (typeof content != "string") content = JSON.stringify(content);
        if (!content.trim()) content = "Something went wrong";
    }

    let navigationButtons = [] as MessageButton[];
    if (page > 0)
        navigationButtons.push(
            new MessageButton()
                .setCustomId(`inventory?id=${author.id}&page=${page - 1}`)
                .setLabel(`PREV`)
                .setStyle(MessageButtonStyles.SECONDARY)
        );

    if (page < Math.ceil(inventory.items.length / 5) - 1)
        navigationButtons.push(
            new MessageButton()
                .setCustomId(`inventory?id=${author.id}&page=${page + 1}`)
                .setLabel(`NEXT`)
                .setStyle(MessageButtonStyles.SECONDARY)
        );
    navigationButtons.push(getShopButton(moi, MessageButtonStyles.PRIMARY).setEmoji("🛒"));
    navigationButtons.push(
        new MessageButton()
            .setCustomId(`inventory?id=${author.id}&page=${page}`)
            .setLabel(`UPDATE`)
            .setEmoji("🔄")
            .setStyle(MessageButtonStyles.PRIMARY)
    );

    let components = [
        new MessageActionRow().addComponents(interactionButtons),
        new MessageActionRow().addComponents(navigationButtons),
    ] as MessageActionRow[];

    return {
        content,
        components,
    };
};
addExclamationCommand("inventory", async (msg) => {
    say(sadie, msg.channel, await getInventoryMessage(msg));
});

addSadieButtonCommand("inventory", async (interaction) => {
    if (!interaction.channel) {
        interaction.reply({
            ephemeral: true,
            content: `You can't use this command here!`,
        });
        return;
    }
    if (!isSameUser(interaction)) {
        interaction.reply({
            ephemeral: true,
            content: `You cannot use the inventory for other people!`,
        });
        return;
    }
    let page = parseInt(interaction.customId.match(/page=([^&]+?)(&|$)/)?.[1] || "0");
    interaction.update(await getInventoryMessage(interaction, page));
});

addSadieButtonCommand("use", async (interaction) => {
    if (!isSameUser(interaction)) {
        interaction.reply({
            ephemeral: true,
            content: `You cannot use the inventory for other people!`,
        });
        return;
    }
    let itemIndex = parseInt(interaction.customId.match(/item=([^&]+?)(&|$)/)?.[1] || "0");
    let page = parseInt(interaction.customId.match(/page=([^&]+?)(&|$)/)?.[1] || "0");
    let inventory = await Inventory.get(interaction, interaction.user);
    let item = inventory.items[itemIndex];
    if (!item) {
        interaction.reply({
            ephemeral: true,
            content: `Item not found`,
        });
        return;
    }
    if (item.count == 0) {
        interaction.reply({
            ephemeral: true,
            content: `You don't have any ${item.name}`,
        });
        return;
    }
    if (!Inventory.canEquip(item) && !Inventory.canUse(item)) {
        interaction.reply({
            ephemeral: true,
            content: `You can't use this item`,
        });
        return;
    }
    let text;
    if (Inventory.canUse(item)) {
        if (item.equipped) text = `${item.name} is already in use`;
        else {
            await Inventory.use(interaction, itemIndex, interaction.user, inventory);
            text = `Used item ${item.name}`;
        }
    } else {
        if (item.equipped) {
            await Inventory.unequip(interaction, itemIndex, interaction.user, inventory);
            text = `Unequipped item ${item.name}`;
        } else {
            await Inventory.equip(interaction, itemIndex, interaction.user, inventory);
            text = `Equipped item ${item.name}`;
        }
    }
    let message = await getInventoryMessage(interaction, page);
    message.content = text + "\n\n" + message.content;
    interaction.update(message);

    // interaction.update(await getInventoryMessage(interaction, page));
});

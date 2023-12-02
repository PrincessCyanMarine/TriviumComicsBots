import { ButtonInteraction, Interaction, Message, MessageActionRow, MessageButton } from "discord.js";
import { addExclamationCommand } from "../common";
import { Inventory } from "../model/inventory";
import { MessageButtonStyles } from "discord.js/typings/enums";
import { say } from "../common/functions";
import { sadie } from "../clients";
import { addD20ButtonCommand } from "../interactions/button/d20";
import { addSadieButtonCommand } from "../interactions/button/sadie";

let ShopItems: (Partial<Inventory.Item> | [Partial<Inventory.Item>, number | undefined])[] = [
    { id: Inventory.ITEM_DICT["Divorce papers"] },
    Inventory.makePotion(
        {
            amount: 50,
            effect: "heal",
            type: "mana",
            target: "self",
        },
        "Weak mana restore potion",
        "Restores 50 mana",
        100,
        50
    ),
    Inventory.makePotion(
        {
            amount: 100,
            effect: "heal",
            type: "mana",
            target: "self",
        },
        "Mana restore potion",
        "Restores 100 mana",
        250,
        125
    ),
    Inventory.makePotion(
        {
            amount: 250,
            effect: "heal",
            type: "mana",
            target: "self",
        },
        "Stong mana restore potion",
        "Restores 200 mana",
        500,
        250
    ),
    Inventory.makePotion(
        {
            amount: 50,
            duration: 5,
            effect: "buff",
            type: "mana",
            target: "self",
        },
        "Weak max mana potion",
        "Raises max mana by 50 for 5 minutes",
        150,
        75
    ),
    Inventory.makePotion(
        {
            amount: 100,
            duration: 5,
            effect: "buff",
            type: "mana",
            target: "self",
        },
        "Max mana potion",
        "Raises max mana by 100 for 5 minutes",
        300,
        150
    ),
    Inventory.makePotion(
        {
            amount: 150,
            duration: 5,
            effect: "buff",
            type: "mana",
            target: "self",
        },
        "Strong max mana potion",
        "Raises max mana by 150 for 5 minutes",
        800,
        400
    ),
    { id: 0 },
    { id: 1 },
    { id: -1 },
    Inventory.makePotion(
        {
            amount: 50,
            duration: 20,
            effect: "buff",
            type: "manaRegen",
            target: "self",
        },
        "REALLY STRONG max regen potion",
        "Raises mana regen by 50 for 20 minutes",
        Number.MAX_VALUE,
        75
    ),
];

let getWelcomeMessage = async (moi: Message | Interaction) => {
    let id = moi instanceof Message ? moi.author.id : moi.user.id;
    let buttons = [
        new MessageActionRow().addComponents(
            new MessageButton().setCustomId(`buy?id=${id}&page=0`).setLabel(`BUY`).setStyle(MessageButtonStyles.SUCCESS),
            new MessageButton().setCustomId(`sell?id=${id}&page=0`).setLabel(`SELL`).setStyle(MessageButtonStyles.DANGER)
        ),
    ];
    return {
        content: `Welcome to the shop!`,
        components: buttons,
    };
};

let isSameUser = (interaction: ButtonInteraction) => interaction.user.id == interaction.customId.match(/id=([^&]+?)(&|$)/)?.[1];

let getShopBuy = (interaction: ButtonInteraction, page = 0) => {
    if (!isSameUser(interaction)) {
        return {
            ephemeral: true,
            content: `You cannot use the shop for other people!`,
        };
    }
    if (page < 0) page = 0;
    else if (page > Math.ceil(ShopItems.length / 5) - 1) page = Math.ceil(ShopItems.length / 5) - 1;
    let items = ShopItems.slice(page * 5, page * 5 + 5).map((i) => {
        let item;
        let amount;
        if (Array.isArray(i)) {
            item = i[0];
            amount = i[1];
        } else {
            item = i;
            amount = undefined;
        }
        if (amount == undefined) amount = 1;
        return [{ ...Inventory.getItemById(item.id), ...item }, amount];
    }) as [Inventory.Item, number][];
    let components = [
        new MessageActionRow().addComponents(
            ...items.map(([item, amount], i) =>
                new MessageButton()
                    .setCustomId(`buyItem?id=${interaction.user.id}&item=${page * 5 + i}`)
                    .setLabel(`${item.buyPrice < 0 ? "SOLD OUT" : `${amount}x ${item.name}`}`)
                    .setDisabled(item.buyPrice < 0)
                    .setStyle(MessageButtonStyles.PRIMARY)
            )
        ),
    ];
    let pageButtons = [];
    if (page > 0)
        pageButtons.push(
            new MessageButton()
                .setCustomId(`buy?id=${interaction.user.id}&page=${page - 1}`)
                .setLabel(`PREV`)
                .setStyle(MessageButtonStyles.SECONDARY)
        );

    if (page < Math.ceil(ShopItems.length / 5) - 1)
        pageButtons.push(
            new MessageButton()
                .setCustomId(`buy?id=${interaction.user.id}&page=${page + 1}`)
                .setLabel(`NEXT`)
                .setStyle(MessageButtonStyles.SECONDARY)
        );
    pageButtons.push(new MessageButton().setCustomId(`sell?id=${interaction.user.id}&page=0`).setLabel(`SELL`).setStyle(MessageButtonStyles.DANGER));

    if (pageButtons.length > 0) components.push(new MessageActionRow().addComponents(...pageButtons));
    let content = `Welcome to the shop!\nPage ${page + 1}/${Math.ceil(ShopItems.length / 5)}\n\`\`\`\n${items
        .map(([i, a]) => `${a}x ${i.name}: ${i.buyPrice < 0 ? "SOLD OUT" : i.buyPrice}\n- ${i.description}`)
        .join("\n\n")}\n\`\`\``;

    return { content, components };
};

let getShopSell = async (interaction: ButtonInteraction, page = 0) => {
    if (!isSameUser(interaction)) {
        return {
            ephemeral: true,
            content: `You cannot use the shop for other people!`,
        };
    }
    let inventory = await Inventory.get(interaction, interaction.user);
    if (page < 0) page = 0;
    else if (page > Math.ceil(inventory.items.length / 5) - 1) page = Math.ceil(inventory.items.length / 5) - 1;
    let items = inventory.items.slice(page * 5, page * 5 + 5).map((i) => {
        return { ...Inventory.getItemById(i.id), ...i };
    }) as Inventory.Item[];
    let components = [
        new MessageActionRow().addComponents(
            ...items.map((item, i) =>
                new MessageButton()
                    .setCustomId(`sellItem?id=${interaction.user.id}&item=${page * 5 + i}`)
                    .setLabel(`${item.sellPrice < 0 ? "UNTRADABLE" : `${item.name}`}`)
                    .setDisabled(item.sellPrice < 0)
                    .setStyle(MessageButtonStyles.PRIMARY)
            )
        ),
    ];
    let pageButtons = [];
    if (page > 0)
        pageButtons.push(
            new MessageButton()
                .setCustomId(`sell?id=${interaction.user.id}&page=${page - 1}`)
                .setLabel(`PREV`)
                .setStyle(MessageButtonStyles.SECONDARY)
        );
    if (page < Math.ceil(inventory.items.length / 5) - 1)
        pageButtons.push(
            new MessageButton()
                .setCustomId(`sell?id=${interaction.user.id}&page=${page + 1}`)
                .setLabel(`NEXT`)
                .setStyle(MessageButtonStyles.SECONDARY)
        );
    pageButtons.push(new MessageButton().setCustomId(`buy?id=${interaction.user.id}&page=0`).setLabel(`BUY`).setStyle(MessageButtonStyles.SUCCESS));
    if (pageButtons.length > 0) components.push(new MessageActionRow().addComponents(...pageButtons));
    let content = `Welcome to the shop!\nPage ${page + 1}/${Math.ceil(inventory.items.length / 5)}\n\`\`\`\n${items
        .map((i) => `${i.count}x ${i.name}: ${i.sellPrice < 0 ? "UNTRADABLE" : i.sellPrice}\n- ${i.description}`)
        .join("\n\n")}\n\`\`\``;
    return { content, components };
};

let buyItem = async (interaction: ButtonInteraction, itemIndex: number) => {
    if (!isSameUser(interaction)) {
        interaction.reply({
            ephemeral: true,
            content: `You cannot use the shop for other people!`,
        });
        return;
    }
    let sItem = ShopItems[itemIndex];
    let item: Inventory.Item;
    let amount: number;
    if (Array.isArray(sItem)) {
        item = sItem[0] as Inventory.Item;
        amount = sItem[1] ?? 1;
    } else {
        item = sItem as Inventory.Item;
        amount = 1;
    }
    item = { ...Inventory.getItemById(item.id), ...item };
    if (item.buyPrice < 0) {
        interaction.reply({
            ephemeral: true,
            content: `This item is sold out!`,
        });
        return;
    }
    let gold = await Inventory.getGold(interaction, interaction.user);
    if (gold < item.buyPrice) {
        interaction.reply({
            ephemeral: true,
            content: `You do not have enough gold!`,
        });
        return;
    }
    if (item.maxCount && item.maxCount > 0) {
        let hasItem = await Inventory.itemCount(interaction, item, interaction.user);
        if (hasItem >= item.maxCount) {
            interaction.reply({
                ephemeral: true,
                content: `You cannot have more than ${item.maxCount} of this item!`,
            });
            return;
        }
    }
    try {
        await Inventory.give(interaction, item, amount);
        await Inventory.addGold(interaction, -item.buyPrice);
        let msg = await getShopBuy(interaction, Math.floor(itemIndex / 5));
        msg.content =
            `${interaction.user} bought ${item.name} for ${item.buyPrice} gold!\nThey now have ${gold - item.buyPrice} gold\n` + msg.content;
        interaction.update(msg);
    } catch (e: any) {
        interaction.reply({
            content: `${interaction.user} tried to buy ${item.name}\n${e.message as string}`,
        });
        return;
    }
};

let sellItem = async (interaction: ButtonInteraction, itemIndex: number) => {
    if (!isSameUser(interaction)) {
        interaction.reply({
            ephemeral: true,
            content: `You cannot use the shop for other people!`,
        });
        return;
    }
    let inventory = await Inventory.get(interaction, interaction.user);
    let item = { ...inventory.items[itemIndex] };
    if (item.sellPrice < 0) {
        interaction.reply({
            ephemeral: true,
            content: `You can't sell this item!`,
        });
        return;
    }

    try {
        await Inventory.take(interaction, item, 1);
        await Inventory.addGold(interaction, item.sellPrice);
        let msg = await getShopSell(interaction, Math.floor(itemIndex / 5));
        msg.content =
            `${interaction.user} sold ${item.name} for ${item.buyPrice} gold!\nThey now have ${await Inventory.getGold(interaction)} gold\n` +
            msg.content;
        interaction.update(msg);
    } catch (e: any) {
        interaction.reply({
            content: `${interaction.user} tried to sell ${item.name}\n${e.message as string}`,
        });
        return;
    }
};

addExclamationCommand("shop", async (msg) => {
    say(sadie, msg.channel, await getWelcomeMessage(msg));
});

addSadieButtonCommand("buy", async (interaction) => {
    let page = parseInt(interaction.customId.match(/page=([^&]+?)(&|$)/)?.[1] ?? "0");
    interaction.update(await getShopBuy(interaction, page));
});

addSadieButtonCommand("sell", async (interaction) => {
    let page = parseInt(interaction.customId.match(/page=([^&]+?)(&|$)/)?.[1] ?? "0");
    interaction.update(await getShopSell(interaction, page));
});

addSadieButtonCommand("buyItem", async (interaction) => {
    let itemIndex = parseInt(interaction.customId.match(/item=([^&]+?)(&|$)/)?.[1] ?? "-1");
    await buyItem(interaction, itemIndex);
});

addSadieButtonCommand("sellItem", async (interaction) => {
    let itemIndex = parseInt(interaction.customId.match(/item=([^&]+?)(&|$)/)?.[1] ?? "-1");
    await sellItem(interaction, itemIndex);
});

import { CommandInteraction, Message } from "discord.js";
import { database } from "..";

export namespace Inventory {
    export type ItemType = "weapon" | "armor" | "consumable" | "misc";
    export type ArmorSlot = "head" | "chest" | "legs" | "feet" | "ring" | "neck" | "offhand" | "mainhand";
    export type WeaponType = "sword" | "axe" | "bow" | "staff" | "dagger";
    export type ConsumableType = "potion" | "food" | "scroll";
    export type MiscType = "material" | "other";
    export type ItemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

    export type ItemEffect = {
        type: "attack" | "defense" | "health" | "mana" | "speed" | "luck" | "accuracy" | "evasion" | "manaRegen" | "healthRegen";
        amount: number;
        target: "self";
        effect: "buff" | "debuff" | "heal" | "damage";
    };

    export type Item = {
        name: string;
        rarity: ItemRarity;
        description: string;
        effects: ItemEffect[];
        equipped?: boolean;
        index: number;
    } & (
        | {
              type: "weapon";
              weaponType?: WeaponType;
          }
        | {
              type: "armor";
              slot: ArmorSlot;
          }
        | {
              type: "consumable";
              consumableType: ConsumableType;
          }
        | {
              type: "misc";
              miscType: MiscType;
          }
    );

    export type Inventory = {
        items: Item[];
        equipped: {
            weapon?: Item | null;
            armor: {
                head?: Item | null;
                chest?: Item | null;
                legs?: Item | null;
                feet?: Item | null;
                ring?: Item | null;
                neck?: Item | null;
                offhand?: Item | null;
                mainhand?: Item | null;
            };
        };
        gold: number;
    };

    export async function get(moi: Message | CommandInteraction, target = moi instanceof Message ? moi.author : moi.user) {
        let inventory: Inventory = (await database.child(`inventory/` + moi.guild?.id + "/" + target.id).once("value")).val();
        if (!inventory) {
            inventory = {
                items: [],
                equipped: {
                    armor: {},
                    weapon: null,
                },
                gold: 0,
            };
            // await set(moi, target, inventory);
        }
        return inventory;
    }

    export async function set(moi: Message | CommandInteraction, target = moi instanceof Message ? moi.author : moi.user, inventory: Inventory) {
        return database.child(`inventory/` + moi.guild?.id + "/" + target.id).set(inventory);
    }

    export async function equip(
        moi: Message | CommandInteraction,
        target = moi instanceof Message ? moi.author : moi.user,
        index: number,
        inventory?: Inventory
    ) {
        if (!inventory) inventory = await get(moi, target);
        let item = inventory.items[index];
        if (!item) throw new Error("No item at index " + index);
        if (item.equipped) throw new Error("Item at index " + index + " is already equipped");
        inventory.items[index].equipped = true;
        switch (item.type) {
            case "armor":
                inventory.equipped.armor[item.slot] = item;
                break;
            case "weapon":
                inventory.equipped.weapon = item;
                break;
            default:
                throw new Error("Invalid item type: " + item.type);
        }
        await set(moi, target, inventory);
        return inventory;
    }

    export async function give(
        moi: Message | CommandInteraction,
        target = moi instanceof Message ? moi.author : moi.user,
        item: Item,
        inventory?: Inventory
    ) {
        if (!inventory) inventory = await get(moi, target);
        let index = inventory.items.length;
        item.index = index;
        inventory.items.push(item);
        await set(moi, target, inventory);
        return inventory;
    }

    export async function activeEffects(moi: Message | CommandInteraction, target = moi instanceof Message ? moi.author : moi.user) {
        let inventory = await get(moi, target);
        let effects: ItemEffect[] = [];
        for (let item of inventory.items) {
            if (item.equipped) {
                effects.push(...item.effects);
            }
        }
        return effects;
    }
}

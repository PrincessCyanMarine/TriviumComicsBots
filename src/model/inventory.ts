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
        item?: Item;
    };

    export type Item = {
        name: string;
        rarity: ItemRarity;
        description: string;
        effects: ItemEffect[];
        equipped?: boolean;
        id: number;
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
            weapon?: number | null;
            armor: {
                head?: number | null;
                chest?: number | null;
                legs?: number | null;
                feet?: number | null;
                ring?: number | null;
                neck?: number | null;
                offhand?: number | null;
                mainhand?: number | null;
            };
        };
        gold: number;
    };

    function getItemById(index: number) {
        return ITEMS[index];
    }

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
        } else {
            inventory.items = inventory.items.map((item) => {
                return { ...item, ...getItemById(item.id) };
            });
        }
        return inventory;
    }

    export async function set(moi: Message | CommandInteraction, target = moi instanceof Message ? moi.author : moi.user, inventory: Inventory) {
        inventory.items = inventory.items.map((item) => {
            return {
                id: item.id,
                equipped: item.equipped,
            } as Item;
        });
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
        let alredyEquipped = -1;
        switch (item.type) {
            case "armor":
                alredyEquipped = inventory.equipped.armor[item.slot] || -1;
                inventory.equipped.armor[item.slot] = index;
                break;
            case "weapon":
                alredyEquipped = inventory.equipped.weapon || -1;
                inventory.equipped.weapon = index;
                break;
            default:
                throw new Error("Invalid item type: " + item.type);
        }
        if (alredyEquipped >= 0) inventory.items[alredyEquipped].equipped = false;

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
        inventory.items.push(item);
        await set(moi, target, inventory);
        return inventory;
    }

    export async function activeEffects(moi: Message | CommandInteraction, target = moi instanceof Message ? moi.author : moi.user) {
        let inventory = await get(moi, target);
        let effects: ItemEffect[] = [];
        for (let item of inventory.items) {
            if (item.equipped) {
                effects.push(...item.effects.map((e) => ({ ...e, item })));
            }
        }
        return effects;
    }

    export const ITEMS: Record<number, Item> = {
        0: {
            description: "A ring specially forged for Razraz. It increases his mana by 20",
            effects: [
                {
                    amount: 20,
                    effect: "buff",
                    target: "self",
                    type: "mana",
                },
            ],
            equipped: true,
            name: "AC's Helpful Ring",
            rarity: "uncommon",
            slot: "ring",
            type: "armor",
            id: 0,
        },
    };
}

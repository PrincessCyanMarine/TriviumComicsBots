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
        equippable?: boolean;
        equipped?: boolean;
        id: number;
        maxCount?: number;
        count?: number;
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
        equipped?: {
            weapon?: number | null;
            armor?: {
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

    export function getItemById<T extends number | null | undefined, R extends T extends number ? Item : null>(id: T): R {
        if (!id && id != 0) return null as R;
        let item = ITEMS[id!] as R;
        if (!item) throw new Error("No item with id " + id);
        return item;
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
            if (!inventory?.items?.length) inventory.items = [];
            else
                inventory.items = await Promise.all(
                    inventory.items
                        .map((item) => {
                            return { ...item, ...getItemById(item.id) };
                        })
                        .filter((item) => item != null)
                        .filter((item, i, a) => a.findIndex((i2) => i2.id == item.id) == i)
                        .map(async (item) => {
                            return { ...item, count: await itemCount(moi, item, target, inventory) };
                        })
                );
        }
        return inventory;
    }

    export async function set(moi: Message | CommandInteraction, target = moi instanceof Message ? moi.author : moi.user, inventory: Inventory) {
        inventory.items = inventory.items
            .filter((item) => {
                if (item.count && item.count <= 0) return false;
                return true;
            })
            .map((item) => {
                return {
                    id: item.id,
                    count: item.count || 1,
                    equipped: item.equipped || false,
                } as Item;
            });
        return database.child(`inventory/` + moi.guild?.id + "/" + target.id).set(inventory);
    }

    export async function unequip(
        moi: Message | CommandInteraction,
        index: number,
        target = moi instanceof Message ? moi.author : moi.user,
        inventory?: Inventory
    ) {
        if (!inventory) inventory = await get(moi, target);
        let item = inventory.items[index];
        if (!item) throw new Error("No item at index " + index);
        if (!item.equipped) throw new Error("Item at index " + index + " is not equipped");
        inventory.items[index].equipped = false;
        if (!inventory.equipped) inventory.equipped = {};
        switch (item.type) {
            case "armor":
                if (inventory.equipped.armor) inventory.equipped.armor[item.slot] = null;
                break;
            case "weapon":
                inventory.equipped.weapon = null;
                break;
            default:
                throw new Error("Invalid item type: " + item.type);
        }

        await set(moi, target, inventory);
        return inventory;
    }

    export async function equip(
        moi: Message | CommandInteraction,
        index: number,
        target = moi instanceof Message ? moi.author : moi.user,
        inventory?: Inventory
    ) {
        if (!inventory) inventory = await get(moi, target);
        let item = inventory.items[index];
        if (!item) throw new Error("No item at index " + index);
        if (!(await canEquip(item))) throw new Error("Can't equip item " + item.name);
        if (item.equipped) throw new Error("Item at index " + index + " is already equipped");
        inventory.items[index].equipped = true;
        let alredyEquipped: number | null = null;
        if (!inventory.equipped) inventory.equipped = {};
        switch (item.type) {
            case "armor":
                if (!inventory.equipped.armor) inventory.equipped.armor = {};
                alredyEquipped = inventory.equipped.armor[item.slot] ?? null;
                inventory.equipped.armor[item.slot] = item.id;
                break;
            case "weapon":
                alredyEquipped = inventory.equipped.weapon ?? null;
                inventory.equipped.weapon = item.id;
                break;
        }
        console.log("alredyEquipped", alredyEquipped);

        if (alredyEquipped != null) {
            let aeIndex = inventory.items.findIndex((i) => i.id == alredyEquipped!);
            inventory.items[aeIndex].equipped = false;
        }
        await set(moi, target, inventory);
        return inventory;
    }

    export async function take(
        moi: Message | CommandInteraction,
        item: Item | number,
        count = 1,
        target = moi instanceof Message ? moi.author : moi.user,
        inventory?: Inventory
    ): Promise<Inventory> {
        if (typeof item == "number") item = getItemById(item);
        if (!inventory) inventory = await get(moi, target);
        if (count < 0) return give(moi, item, -count, target, inventory);
        if (count == 0) return inventory;
        let index = inventory.items.findIndex((i) => i.id == (item as Item).id);
        if (index < 0) throw new Error("Can't take item " + item.name + " from " + target.username + " because they don't have it");
        let iCount = await itemCount(moi, item, target, inventory);
        if (iCount < count) count = iCount;
        if ((inventory.items[index].count || 1) > count) {
            inventory.items[index].count = (inventory.items[index].count || 1) - count;
        } else {
            if (inventory.items[index].equipped) await unequip(moi, index, target, inventory);
            inventory.items.splice(index, 1);
        }
        await set(moi, target, inventory);
        return inventory;
    }

    export async function give(
        moi: Message | CommandInteraction,
        item: Item | number,
        count = 1,
        target = moi instanceof Message ? moi.author : moi.user,
        inventory?: Inventory
    ): Promise<Inventory> {
        console.log(item);
        if (typeof item == "number") item = getItemById(item);
        if (!item) throw new Error("Invalid item id " + item);
        if (!inventory) inventory = await get(moi, target);
        if (count < 0) return take(moi, item, -count, target, inventory);
        if (count == 0) return inventory;
        if (item.maxCount && item.maxCount > 0) {
            let hasCount = await itemCount(moi, item, target, inventory);
            if (hasCount + count > item.maxCount) throw new Error("Can't have more than " + item.maxCount + " of item " + item.name);
        }
        if (count != 1) item.count = count;
        let index = await hasItem(moi, item, target, inventory);
        if (index >= 0) {
            inventory.items[index].count = (inventory.items[index].count || 1) + count;
        } else {
            inventory.items.push(item);
        }
        await set(moi, target, inventory);
        return inventory;
    }

    export async function hasItem(
        moi: Message | CommandInteraction,
        item: Item | number,
        target = moi instanceof Message ? moi.author : moi.user,
        inventory?: Inventory
    ) {
        if (typeof item == "number") item = getItemById(item);
        if (!inventory) inventory = await get(moi, target);
        return inventory.items.findIndex((i) => i.id == (item as Item).id);
    }

    export async function itemCount(
        moi: Message | CommandInteraction,
        item: Item | number,
        target = moi instanceof Message ? moi.author : moi.user,
        inventory?: Inventory
    ) {
        if (typeof item != "number") item = item.id;
        if (!inventory) inventory = await get(moi, target);
        let match = inventory.items.filter((i) => i.id == (item as number));
        let num = match.reduce((a, b) => a + (b.count || 1), 0);
        return num;
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

    export async function canEquip(item: Item | number) {
        if (typeof item == "number") item = getItemById(item);
        if (item.equippable) return true;
        if (["armor", "weapon"].includes(item.type) && !(item.equippable == false)) return true;
        return false;
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
            name: "AC's Helpful Ring",
            rarity: "uncommon",
            slot: "ring",
            type: "armor",
            id: 0,
            maxCount: 1,
        },
        1: {
            description: "A ring specially forged for Razraz. It decreases his mana by 20",
            effects: [
                {
                    amount: 20,
                    effect: "debuff",
                    target: "self",
                    type: "mana",
                },
            ],
            name: "AC's Unhelpful Ring",
            rarity: "uncommon",
            slot: "ring",
            type: "armor",
            id: 1,
            maxCount: 1,
        },
        2: {
            description: "A ring of promise that signifies a strong bond between two people (+10 mana to the happy couple)",
            effects: [
                {
                    amount: 10,
                    effect: "buff",
                    target: "self",
                    type: "mana",
                },
            ],
            name: "Wedding Rings",
            rarity: "common",
            slot: "ring",
            type: "armor",
            id: 2,
            maxCount: 1,
        },
        3: {
            description: "Papers that signify a past bond between two people (-10 mana to the ex couple)",
            effects: [
                {
                    amount: 10,
                    effect: "debuff",
                    target: "self",
                    type: "mana",
                },
            ],
            name: "Divorce papers",
            miscType: "other",
            rarity: "common",
            type: "misc",
            equippable: true,
            id: 3,
        },
        4: {
            name: "Rings of destruction",
            description: "Does nothing but looks cool",
            id: 4,
            rarity: "rare",
            type: "armor",
            effects: [],
            slot: "ring",
            maxCount: 1,
        },
        "-1": {
            name: "The test stick",
            description: "A stick forged by D20 himself. It is said to be able to do ~~anything~~ nothing",
            id: -1,
            rarity: "common",
            type: "weapon",
            effects: [
                {
                    amount: 100,
                    effect: "buff",
                    target: "self",
                    type: "attack",
                },
            ],
            weaponType: "sword",
            maxCount: 64,
        },
        20: {
            name: "D20 of perfect rolls",
            description: "A magical D20 that guarantees only the best of rolls",
            id: 20,
            equippable: true,
            rarity: "legendary",
            type: "misc",
            equipped: true,
            effects: [
                {
                    amount: 100,
                    effect: "buff",
                    target: "self",
                    type: "luck",
                },
            ],
            miscType: "other",
            maxCount: 1,
        },
    };
}

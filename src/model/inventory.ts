import { CommandInteraction, Message } from "discord.js";
import { database } from "..";
import { getMana, setMana } from "../common/functions";
import { type } from "os";
import { TIME } from "../common/variables";

export namespace Inventory {
    export type ItemType = "weapon" | "armor" | "consumable" | "misc";
    export type ArmorSlot = "head" | "chest" | "legs" | "feet" | "ring" | "neck" | "offhand" | "mainhand";
    export type WeaponType = "sword" | "axe" | "bow" | "staff" | "dagger";
    export type ConsumableType = "potion" | "food" | "scroll";
    export type MiscType = "material" | "other" | "valuable" | "quest" | "key";
    export type ItemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
    export const ItemEffects = ["buff", "debuff", "damage", "heal", "other"] as const;
    export const ItemEffectTypes = [
        "attack",
        // "defense",
        // "health",
        "mana",
        // "speed",
        "luck",
        // "accuracy",
        // "evasion",
        "manaRegen",
        // "healthRegen",
    ] as const;
    export const ItemEffectTargets = ["self", "enemy", "allies", "enemies"] as const;
    export type ItemEffectType = (typeof ItemEffectTypes)[number];
    export type ItemEffectTarget = (typeof ItemEffectTargets)[number];
    export type ItemEffectEffect = (typeof ItemEffects)[number];

    export type ItemEffect = {
        type: ItemEffectType;
        amount: number;
        target: ItemEffectTarget;
        effect: ItemEffectEffect;
        item?: Item;
        duration?: number;
    };

    export type Item = {
        name: string;
        rarity: ItemRarity;
        description: string;
        effects: ItemEffect[];
        equippable?: boolean;
        consumable?: boolean;
        equipped?: boolean;
        id: number;
        maxCount?: number;
        count?: number;
        unstackable?: boolean;
        equippedAt?: number | null;
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

    export async function getGold(moi: Message | CommandInteraction, target = moi instanceof Message ? moi.author : moi.user, inventory?: Inventory) {
        let gold;
        if (!inventory) gold = (await database.child(`inventory/` + moi.guild?.id + "/" + target.id + "/gold").once("value")).val();
        else gold = inventory.gold;
        return (gold || 0) as number;
    }
    export async function addGold(
        moi: Message | CommandInteraction,
        amount: number,
        target = moi instanceof Message ? moi.author : moi.user,
        inventory?: Inventory
    ) {
        let gold = await getGold(moi, target, inventory);
        await setGold(moi, gold + amount, target, inventory);
    }
    export async function setGold(
        moi: Message | CommandInteraction,
        amount: number,
        target = moi instanceof Message ? moi.author : moi.user,
        inventory?: Inventory
    ) {
        if (!inventory) {
            await database.child(`inventory/` + moi.guild?.id + "/" + target.id + "/gold").set(amount);
            return;
        }
        inventory.gold = amount;
        await set(moi, target, inventory);
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
                            let i = { ...getItemById(item.id), ...item };
                            if (!i.unstackable) return i;
                            return cloneItem(i);
                        })
                        .filter((item) => item != null)
                        .filter((item, i, a) => item.unstackable || a.findIndex((i2) => i2.id == item.id) == i)
                        .filter((item) => {
                            if (!item.equippedAt) return true;
                            let hasDuration = item.effects.some((e) => e.duration);
                            if (!hasDuration) return true;
                            return item.equippedAt + item.effects.reduce((a, b) => Math.max(a, b.duration || 0), 0) * TIME.MINUTES > Date.now();
                        })
                        .map(async (item) => {
                            return { ...item, count: await itemCount(moi, item, target, inventory) };
                        })
                );
        }
        return inventory;
    }

    export function cloneItem(item: Item) {
        let _act = <T>(obj: T): T => {
            if (typeof obj == "object") {
                if (Array.isArray(obj)) return obj.map((i) => _act(i)) as T;
                else {
                    for (let [key, value] of Object.entries(obj as Object)) (obj as any)[key] = _act(value) as any;
                    return { ...obj };
                }
            }
            return obj;
        };
        return _act(item);
    }

    export async function set(
        moi: Message | CommandInteraction,
        target = moi instanceof Message ? moi.author : moi.user,
        inventory: Inventory | null
    ) {
        if (!inventory) {
            database.child(`inventory/` + moi.guild?.id + "/" + target.id).remove();
            return;
        }
        inventory.items = inventory.items
            .filter((item) => {
                if (item.count && item.count <= 0) return false;
                return true;
            })
            .map((item) => {
                let i = cloneItem(item);
                let baseItem = getItemById(item.id);
                for (let [key, value] of Object.entries(baseItem)) if ((i as any)[key] == (baseItem as any)[key]) delete (i as any)[key];

                return {
                    ...i,
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
        inventory.items[index].equippedAt = Date.now();
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
        // console.log("alredyEquipped", alredyEquipped);

        if (alredyEquipped != null) {
            let aeIndex = inventory.items.findIndex((i) => i.id == alredyEquipped!);
            inventory.items[aeIndex].equipped = false;
            inventory.items[aeIndex].equippedAt = null;
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
        let index = inventory.items.findIndex((i) => (i.unstackable ? equals(i, item as Item) : i.id == (item as Item).id));
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

    export function equals(a: Item, b: Item): boolean {
        for (let [key, value] of Object.entries(a)) if (value != (b as any)[key]) return false;
        return true;
    }

    export async function give(
        moi: Message | CommandInteraction,
        item: Item | number,
        count = 1,
        target = moi instanceof Message ? moi.author : moi.user,
        inventory?: Inventory
    ): Promise<Inventory> {
        // console.log(item);
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
        let index = item.unstackable ? -1 : await hasItem(moi, item, target, inventory);
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
        if (typeof item == "number") item = getItemById(item);
        if (item.unstackable) return item.count ?? 1;
        if (!inventory) inventory = await get(moi, target);
        let match = inventory.items.filter((i) => i.id == (item as Item).id);
        let num = match.reduce((a, b) => a + (b.count || 1), 0);
        return num;
    }

    export async function activeEffects(moi: Message | CommandInteraction, target = moi instanceof Message ? moi.author : moi.user) {
        let inventory = await get(moi, target);
        let effects: ItemEffect[] = [];
        for (let item of inventory.items) {
            if (item.equipped) {
                effects.push(
                    ...item.effects
                        .filter((e) => !e.duration || e.duration * TIME.MINUTES + (item.equippedAt || 0) > Date.now())
                        .map((e) => ({ ...e, item }))
                );
            }
        }
        return effects;
    }

    export function canEquip(item: Item | number) {
        if (typeof item == "number") item = getItemById(item);
        if (item.equippable) return true;
        if (["armor", "weapon"].includes(item.type) && !(item.equippable == false)) return true;
        if (item.effects.some((e) => e.duration && e.target == "self")) return true;
        return false;
    }

    export function canUse(item: Item | number) {
        if (typeof item == "number") item = getItemById(item);
        if (item.consumable) return true;
        if (item.type == "consumable") return true;
        return false;
    }

    export async function use(
        moi: Message | CommandInteraction,
        index: number,
        target = moi instanceof Message ? moi.author : moi.user,
        inventory?: Inventory
    ) {
        if (!inventory) inventory = await get(moi, target);
        let item = inventory.items[index];
        if (!item) throw new Error("No item at index " + index);
        if (!canUse(item)) throw new Error("Can't use item " + item.name);
        if (item.count && item.count <= 0) throw new Error("Item at index " + index + " has no uses left");
        let hasDuration = item.effects.some((e) => e.duration);
        if (hasDuration) {
            if (item.equipped) {
                throw new Error('Item "' + item.name + '" is already active');
            }
            equip(moi, index, target, inventory);
        }
        console.log(item.type, hasDuration);
        if (item.type == "consumable" && !hasDuration) {
            // console.log(item.type, hasDuration);
            // if (item.count) item.count--;
            // console.log(item.count);
            // await set(moi, target, inventory);
            await take(moi, item, 1, target, inventory);
        }
        for (let effect of item.effects) {
            switch (effect.target) {
                case "self":
                    if (effect.effect == "heal" || effect.effect == "damage") {
                        if (effect.type == "mana") {
                            let mana = await getMana(moi, target);
                            let newMana = mana.value;
                            if (effect.effect == "heal") newMana += effect.amount;
                            else newMana -= effect.amount;
                            await setMana(moi, newMana, target);
                        }
                    }
                    break;
            }
        }

        return item;
    }

    export enum ITEM_DICT {
        "AC's Helpful Ring" = 0,
        "AC's Unhelpful Ring" = 1,
        "Wedding Rings" = 2,
        "Divorce papers" = 3,
        "Rings of destruction" = 4,
        "The test stick" = -1,
        "Shiny rock" = 5,
        "Potion" = 6,
        "D20 of perfect rolls" = 20,
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
        5: {
            name: "Shiny rock",
            description: "A shiny rock. Can be sold for cheap at Sadie's shop",
            id: 5,
            rarity: "common",
            type: "misc",
            effects: [],
            miscType: "valuable",
            maxCount: 999,
        },
        [ITEM_DICT["Potion"]]: {
            name: "Potion",
            description: "A potion that does nothing",
            id: ITEM_DICT["Potion"],
            rarity: "common",
            type: "consumable",
            unstackable: true,
            effects: [],
            consumableType: "potion",
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

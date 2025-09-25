import { Interaction, Message } from "discord.js";
import { database } from "..";
import { capitalize, getMana, setMana } from "../common/functions";
import { type } from "os";
import { TIME } from "../common/variables";
import { Dice } from "../games/adventuring/common";

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
        "defense",
        // "health",
        "mana",
        // "speed",
        "luck",
        // "accuracy",
        // "evasion",
        "manaregen",
        // "healthRegen",
        "damage"
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
        disadvantage?: boolean;
        advantage?: boolean;
        id: number | string;
        maxCount?: number;
        count?: number;
        unstackable?: boolean;
        equippedAt?: number | null;
        buyPrice: number;
        sellPrice: number;
        drop_chance?: number;
        damage?: (Dice | number)[],
        attack?: number,
        defense?: number;
        maxHp?: number;
    } & (
        | {
              type: "weapon";
              weaponType?: WeaponType;
              durability: number,
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
            weapon?: number | string | null;
            armor?: {
                head?: number | null | string;
                chest?: number | null | string;
                legs?: number | null | string;
                feet?: number | null | string;
                ring?: number | null | string;
                neck?: number | null | string;
                offhand?: number | null | string;
                mainhand?: number | null | string;
            };
        };
        gold: number;
    };

    export function getItemById<T extends number | string | null | undefined, R extends T extends number ? Item : (T extends string ? Item : null)>(id: T): R {
        if (!id && id != 0) return null as R;
        let item = ITEMS[id!] as R;
        if (!item) throw new Error("No item with id " + id);
        if (!item.buyPrice && item.buyPrice != 0) item.buyPrice = -1;
        if (!item.sellPrice && item.sellPrice != 0) item.sellPrice = -1;
        return item;
    }

    export async function getGold(moi: Message | Interaction, target = moi instanceof Message ? moi.author : moi.user, inventory?: Inventory) {
        let gold;
        if (!inventory) gold = (await database.child(`inventory/` + moi.guild?.id + "/" + target.id + "/gold").once("value")).val();
        else gold = inventory.gold;
        return (gold || 0) as number;
    }
    export async function addGold(
        moi: Message | Interaction,
        amount: number,
        target = moi instanceof Message ? moi.author : moi.user,
        inventory?: Inventory
    ) {
        let gold = await getGold(moi, target, inventory);
        await setGold(moi, gold + amount, target, inventory);
    }
    export async function setGold(
        moi: Message | Interaction,
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

    export async function get(moi: Message | Interaction, target = moi instanceof Message ? moi.author : moi.user) {
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
            if (!obj) return obj;
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

    function clearItem(item: Item) {
        let _act = <T extends Object>(obj: T, bObj: T): T => {
            if (typeof obj != "object" || typeof bObj != "object") return obj;
            for (let [key] of Object.entries(bObj)) {
                if ((obj as any)[key] == (bObj as any)[key]) delete (obj as any)[key];
                else if (typeof (obj as any)[key] == "object") {
                    if (Array.isArray((obj as any)[key])) {
                        for (let index = 0; index < (obj as any)[key].length; index++) {
                            let value = (obj as any)[key][index];
                            let bValue = (bObj as any)[key][index];
                            if (value == bValue) {
                                (obj as any)[key].splice(index, 1);
                                index--;
                            } else if (typeof value == "object") (obj as any)[key][index] = _act(value, bValue);
                        }
                    } else {
                        (obj as any)[key] = _act((obj as any)[key], (bObj as any)[key]);
                    }
                }
            }
            return obj;
        };
        return _act(cloneItem(item), cloneItem(getItemById(item.id)));
    }

    export async function set(moi: Message | Interaction, target = moi instanceof Message ? moi.author : moi.user, inventory: Inventory | null) {
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
                let i = {
                    ...clearItem(item),
                    id: item.id,
                    count: item.count || 1,
                    equipped: item.equipped || false,
                } as Item;
                if (!i.equipped) {
                    i.equipped = null as any;
                    i.equippedAt = null;
                }

                return i;
            });
        return database.child(`inventory/` + moi.guild?.id + "/" + target.id).set(inventory);
    }

    export async function unequip(
        moi: Message | Interaction,
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
        }

        await set(moi, target, inventory);
        return inventory;
    }

    export async function equip(
        moi: Message | Interaction,
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
        let alredyEquipped: number | string | null = null;
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
        moi: Message | Interaction,
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
        let compare = (a: any, b: any) => {
            if ((!b && !!a) || (!a && !!b)) return false;
            if (typeof a != typeof b) return false;
            if (typeof a == "object") {
                if (Array.isArray(a)) {
                    if (!Array.isArray(b)) return false;
                    if (a.length != b.length) return false;
                    for (let i = 0; i < a.length; i++) if (!compare(a[i], b[i])) return false;
                    return true;
                } else {
                    if (Array.isArray(b)) return false;
                    if (Object.keys(a).length != Object.keys(b).length) return false;
                    for (let [key, value] of Object.entries(a)) if (!compare(value, (b as any)[key])) return false;
                    return true;
                }
            }
            return a == b;
        };
        return compare(a, b);
    }

    export async function give(
        moi: Message | Interaction,
        item: Item | number | string,
        count = 1,
        target = moi instanceof Message ? moi.author : moi.user,
        inventory?: Inventory
    ): Promise<Inventory> {
        // console.debug('item', item);
        if (typeof item === "number") item = getItemById(item);
        if (typeof item === "string") item = getItemById(item);
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
        moi: Message | Interaction,
        item: Item | number,
        target = moi instanceof Message ? moi.author : moi.user,
        inventory?: Inventory
    ) {
        if (typeof item == "number") item = getItemById(item);
        if (!inventory) inventory = await get(moi, target);
        return inventory.items.findIndex((i) => i.id == (item as Item).id);
    }

    export async function itemCount(
        moi: Message | Interaction,
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

    export async function activeEffects(moi: Message | Interaction, target = moi instanceof Message ? moi.author : moi.user) {
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
        moi: Message | Interaction,
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
        // console.log(item.type, hasDuration);
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

    export function makePotion(effects: ItemEffect | ItemEffect[], name?: string, description?: string, buyPrice = -1, sellPrice = -1) {
        if (!Array.isArray(effects)) effects = [effects];
        let item = {
            id: Inventory.ITEM_DICT["Potion"],
            buyPrice,
            sellPrice,
            effects,
        } as Partial<Potion>;
        if (effects.length == 1) {
            let { effect, type, amount, duration } = effects[0];
            if (!name) {
                name = `${capitalize(effect)} ${type} potion (${amount})`;
                if (duration && duration > 0) name += ` (${duration}m)`;
            }
            if (!description) item.description = `A potion that ${effect}s ${type} by ${amount} ${duration ? `for ${duration} minutes` : ""}`;
        }
        if (name) item.name = name;
        if (description) item.description = description;
        return item as Potion;
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
        "Basic Sword" = 'basic_sword',
        "Wood Sword" = 'wood_sword',
        "Gold Sword" = 'gold_sword',
        "Stone Sword" = 'stone_sword',
        "Iron Sword" = 'iron_sword',
        "Diamond Sword" = 'diamond_sword',
        "Netherite Sword" = 'netherite_sword',
        "Slime Goo" = 'slime_goo',
        "D20 of perfect rolls" = 20,
        "Basic Boots" = 'basic_boots',
        "Basic Leggings" = 'basic_leggings',
        "Basic Chestplate" = 'basic_chestplate',
        "Basic Helmet" = 'basic_helmet',
        "Basic Ring" = 'basic_ring',
        "Basic Lesser Ring" = 'basic_lesser_ring',
    }

    export type Potion = Item & {
        id: 6;
        type: "consumable";
        unstackable: true;
        consumableType: "potion";
    };

    export const ITEMS: Record<number | string, Item> = {
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
            equipped: true,
            id: 0,
            maxCount: 1,
            buyPrice: -1,
            sellPrice: -1,
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
            equipped: true,
            type: "armor",
            id: 1,
            maxCount: 1,
            buyPrice: -1,
            sellPrice: -1,
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
            buyPrice: 100,
            sellPrice: 50,
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
            buyPrice: 50,
            sellPrice: 10,
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
            buyPrice: 1000000,
            sellPrice: 1,
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
            buyPrice: -1,
            sellPrice: -1,
            damage: [[200, -1]],
            durability: -1,
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
            buyPrice: 100,
            sellPrice: 20,
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
            buyPrice: -1,
            sellPrice: -1,
        },
        [ITEM_DICT["Basic Sword"]]: {
            name: "Basic Sword",
            description: "",
            id: ITEM_DICT["Basic Sword"],
            equippable: true,
            rarity: "common",
            type: "weapon",
            buyPrice: -1,
            sellPrice: -1,
            effects: [],
            weaponType: "sword",
            damage: [],
            attack: 0,
            maxCount: 64,
            drop_chance: 0,
            durability: -1
        },
        [ITEM_DICT["Slime Goo"]]: {
            name: "Slime Goo",
            description: "Gooey substance left behind by a weak enemy. There are no known uses for it currently",
            id: ITEM_DICT["Slime Goo"],
            equippable: true,
            rarity: "common",
            type: "misc",
            buyPrice: 5,
            sellPrice: 3,
            effects: [],
            miscType: "material",
            drop_chance: 0.5,
        },
        [ITEM_DICT["Basic Boots"]]: {
            name: "Basic Boots",
            description: "",
            id: ITEM_DICT["Basic Boots"],
            equippable: true,
            rarity: "common",
            type: "armor",
            buyPrice: 0,
            sellPrice: 0,
            effects: [],
            slot: "feet",
        },
        [ITEM_DICT["Basic Leggings"]]: {
            name: "Basic Leggings",
            description: "",
            id: ITEM_DICT["Basic Leggings"],
            equippable: true,
            rarity: "common",
            type: "armor",
            buyPrice: 0,
            sellPrice: 0,
            effects: [],
            slot: "legs",
        },
        [ITEM_DICT["Basic Chestplate"]]: {
            name: "Basic Chestplate",
            description: "",
            id: ITEM_DICT["Basic Chestplate"],
            equippable: true,
            rarity: "common",
            type: "armor",
            buyPrice: 0,
            sellPrice: 0,
            effects: [],
            slot: "chest",
        },
        [ITEM_DICT["Basic Helmet"]]: {
            name: "Basic Helmet",
            description: "",
            id: ITEM_DICT["Basic Helmet"],
            equippable: true,
            rarity: "common",
            type: "armor",
            buyPrice: 0,
            sellPrice: 0,
            effects: [],
            slot: "head",
        },
        [ITEM_DICT["Basic Ring"]]: {
            name: "Basic Ring",
            description: "",
            id: ITEM_DICT["Basic Ring"],
            equippable: true,
            rarity: "common",
            type: "armor",
            buyPrice: 0,
            sellPrice: 0,
            effects: [],
            slot: "ring",
        },
        'unlucky_ring': {
            name: "Unlucky Ring",
            description: "A ring that gives the wearer disadvantage",
            id: 'unlucky_ring',
            equippable: true,
            rarity: "legendary",
            type: "armor",
            buyPrice: 0,
            sellPrice: 0,
            effects: [],
            slot: "ring",
            disadvantage: true
        },
        'lucky_ring': {
            name: "Lucky Ring",
            description: "A ring that gives the wearer advantage",
            id: 'lucky_ring',
            equippable: true,
            rarity: "legendary",
            type: "armor",
            buyPrice: 0,
            sellPrice: 0,
            effects: [],
            slot: "ring",
            advantage: true
        },
        [ITEM_DICT["Basic Lesser Ring"]]: {
            name: "Basic Lesser Ring",
            description: "",
            id: ITEM_DICT["Basic Lesser Ring"],
            equippable: true,
            rarity: "common",
            type: "armor",
            buyPrice: 0,
            sellPrice: 0,
            effects: [],
            slot: "ring",
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
            buyPrice: -1,
            sellPrice: -1,
        },
    };

    const swords: (Partial<Item & {type: "weapon"}> & {id: ITEM_DICT})[] = [
        {
            id: ITEM_DICT["Wood Sword"],
            name: 'Wood Sword',
            description: 'A basic sword used by new adventurers',
            damage: [[1, 4]],
            attack: -1,
            durability: 8,
            buyPrice: 10,
            sellPrice: 5,
        },
        {
            id: ITEM_DICT["Gold Sword"],
            name: 'Gold Sword',
            description: 'Like the wood sword but worse in every way (scam item)',
            damage: [[1, 4]],
            attack: -1,
            buyPrice: 10000,
            sellPrice: 10000,
            durability: 2,
        },
        {
            id: ITEM_DICT["Stone Sword"],
            name: 'Stone Sword',
            description: 'A slightly sturdier sword for slightly more experienced adventurers',
            damage: [[1, 6]],
            attack: 0,
            durability: 8,
            buyPrice: 20,
            sellPrice: 10,
        },
        {
            id: ITEM_DICT["Iron Sword"],
            name: 'Iron Sword',
            description: 'The sword used by most adventurers',
            damage: [[1, 8]],
            attack: 1,
            buyPrice: 40,
            sellPrice: 20,
            durability: 24,
        },
        {
            id: ITEM_DICT["Diamond Sword"],
            name: 'Diamond Sword',
            description: 'An expensive sword used by high ranking adventurers',
            damage: [[2, 8]],
            attack: 2,
            durability: 40,
        },
        {
            id: ITEM_DICT["Netherite Sword"],
            name: 'Netherite Sword',
            description: 'Just the sight of this blade is enough to send shivers down the spines of some ancient dragons',
            damage: [[3, 10]],
            attack: 3,
            durability: 64,
        }
    ]
    export const shop_items: Partial<Item>[] = [];
    const addToShop = (id: string | ITEM_DICT) => shop_items.push({ id });
    for (const sword of swords) {
        sword.description = `[${sword.damage!.map((d) => typeof d === 'number' ? d : d.join('d')).join('+')}] (${sword.attack! >= 0 ? '+' : ''}${sword.attack!} attack) ${sword.description}`
        ITEMS[sword.id] = {
            ...ITEMS[ITEM_DICT['Basic Sword']],
            ...sword,
        } as any;
        addToShop(sword.id);
    }
    const armor_materials = [
        {
            name: 'Leather',
            defense: [1, 2, 3, 1],
            price: [10, 30, 50, 20]
        },
        {
            name: 'Chainmail',
            defense: [2, 3, 4, 2],
            price: [40, 60, 80, 50]
        }
    ]
    // "head" | "chest" | "legs" | "feet" | "ring" | "neck" | "offhand" | "mainhand";
    const armor_pieces = ['Boots', 'Leggings', 'Chestplate', 'Helmet']
    for (const material of armor_materials) {
        for (let i = 0; i < armor_pieces.length; i++) {
            const piece = armor_pieces[i];
            const armor = {...ITEMS[`basic_${piece.toLowerCase()}`]};
            armor.defense = material.defense[i];
            armor.buyPrice = material.price[i];
            armor.sellPrice = armor.buyPrice / 2;
            armor.description = `+${armor.defense} defense`;
            armor.name = `${material.name} ${piece}`;
            armor.id = `${material.name.toLowerCase()}_${piece.toLowerCase()}`;
            ITEMS[armor.id] = armor;
            addToShop(armor.id);
        }
    }
    const rings = [
        {
            name: 'Health',
            values: [5, 10],
            prices: [20, 40],
            property: 'maxHp'
        },
        {
            name: 'Defense',
            values: [2, 3],
            prices: [40, 90],
            property: 'defense'
        },
        {
            name: 'Strength',
            values: [[1], [2]],
            prices: [20, 40],
            property: 'damage'
        },
        {
            name: 'Accuracy',
            values: [1, 2],
            prices: [30, 60],
            property: 'attack'
        }
    ];
    const ring_types = [['lesser_', 'Lesser'], ['', '']]
    for (const _ring of rings) {
        for (let i = 0; i < ring_types.length; i++) {
            const [type, typeName] = ring_types[i];
            const ring = {...ITEMS[`basic_${type}ring`]};
            (ring as any)[_ring.property] = _ring.values[i];
            ring.buyPrice = _ring.prices[i];
            ring.sellPrice = ring.buyPrice / 2;
            ring.description = `+${_ring.values[i]} ${_ring.property}`;
            ring.name = `${typeName} ${_ring.name} Ring`;
            ring.id = `${type}${_ring.name.toLowerCase()}_ring`;
            ITEMS[ring.id] = ring;
            addToShop(ring.id);
        }
    }
    /*
        "Lesser Health Ring" = 'lesser_health_ring',
        "Health Ring" = 'health_ring',
        'Lesser Strength Ring' = 'lesser_strength_ring',
        'Strength Ring' = 'strength_ring',
        'Lesser Defense Ring' = 'lesser_defense_ring',
        'Defense Ring' = 'defense_ring',
    */
}

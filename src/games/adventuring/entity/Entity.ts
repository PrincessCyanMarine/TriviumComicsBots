import { readdirSync, readFileSync, statSync } from "fs";
import { Dice, rollDice, rollDie, RolledDice, RolledDie } from "../common";
import { Inventory } from "../../../model/inventory";
import { getMana, randomchance } from "../../../common/functions";
import { User, Interaction, Message, GuildMember, ButtonInteraction } from "discord.js";
import { database } from "../../..";

type EntityDataObject = {
    readonly hp?: number;
    readonly name: string
    readonly id: string
    readonly maxHp: number;
    readonly attack: number;
    readonly defense: number;
    readonly damage: (Dice | number)[];
    readonly inventory: (Partial<Inventory.Item> & { id: number | string })[]
    readonly drops?: [number, Inventory.Item][]
    readonly gold?: [number, number]
};

type PlayerEntityDataObject = EntityDataObject & {
    readonly mana: number;
    readonly stamina: number;
}

export type AttackInfo = {
    roll: number,
    damage: number,
    crit: boolean,
    critFail: boolean,
    rolled: RolledDice,
    hit: boolean,
}

const entities: { [id: string]: EntityDataObject } = {};

export default class Entity implements EntityDataObject {
    protected _maxHp!: number;
    protected _attack!: number;
    protected _defense!: number;
    protected _damage!: (Dice | number)[];
    protected _name!: string;
    protected _hp!: number;
    protected _drops!: [number, Inventory.Item][]
    protected _inventory!: Inventory.Item[];
    protected _player: GuildMember;
    protected _gold!: [number, number];
    
    get hp() { return this._hp };
    get maxHp() { return this._maxHp };
    get attack() { return this._attack };
    get defense() { return this._defense };
    get damage() { return this._damage };
    get id() { return this._id };
    get name() { return this._name };
    get inventory() { return this._inventory }
    get drops() { return this._drops };
    get gold() { return this._gold };

    get dead() { return this.hp <= 0 };


    set hp(value: number) {
        this._hp = value;
    }

    protected constructor (protected _id: string, protected _moi: Message | Interaction,) {
        if (!Object.keys(entities).includes(this._id)) throw new Error(`Invalid entity id: ${this._id}`);
        this._player = _moi instanceof Message ? _moi.member! : _moi.member as GuildMember;
    }

    public static async spawn(moi: Message | Interaction, id?: string, hp?: number): Promise<Entity> {
        if (!id || typeof id !== 'string') throw 'No id given for entity'
        return new this(id, moi).populate(hp);
    }

    protected async populate(hp?: number) {
        for (const [key, value] of Object.entries(await this.getTypeData())) (this as any)['_' + key] = value;
        this._hp = hp || this._maxHp
        this._inventory = this._inventory.map((item) => ({ ...Inventory.getItemById(item.id), ...item }));
        for (const item of this.inventory) {
            if (item.type !== 'weapon' || !item.equipped) continue;
            this._damage = [...this.damage, ...item.damage];
            this._attack += item.attack || 0;
        }
        this._damage.sort((a, b) => {
            if (typeof a !== typeof b) {
                if (typeof a === 'number') return 1;
                return -1;
            }
            if (typeof a === 'number') return a - (b as number);
            return a[1] - (b as Dice)[1];
        })
        return this;
    }

    static validate(obj: any): obj is EntityDataObject {
        if (typeof obj !== 'object' || Array.isArray(obj)) return false;
        for (const num of ['maxHp', 'attack', 'defense']) if (!(num in obj) || typeof obj[num] !== 'number') return false;
        for (const str of ['name', 'id']) if (!(str in obj) || typeof obj[str] !== 'string') return false;
        if (!('damage' in obj) || !Array.isArray(obj.damage)) return false;
        if (!('inventory' in obj) || !Array.isArray(obj.inventory)) return false;
        for (const value of obj.damage) {
            if (typeof value !== 'number') {
                if (!Array.isArray(value) || value.length !== 2) return false;
                if (value.some(a => typeof a !== 'number')) return false;
            }
        }
        for (const item of obj.inventory) {
            if (typeof item !== 'object') return false;
            if (!Inventory.getItemById(item.id)) return false;
        }
        return true;
    }

    async getTypeData(): Promise<EntityDataObject> {
        return entities[this.id];
    }

    testCrit(roll: number, target: Entity): boolean {
        return roll === 20;
    }

    testCritFail(roll: number, target: Entity): boolean {
        return roll === 1;
    }

    rollDamage() {
        return this.damage.reduce((acc, die) => [...acc, ...(typeof die === 'number' ? [([0, die] as unknown as RolledDie)] : rollDice(die))], [] as RolledDice);
    }

    attackEntity(target: Entity): AttackInfo {
        const res: AttackInfo = { rolled: [], damage: 0, crit: false, critFail: false, hit: false, roll: 0 };
        const roll = rollDie(20);
        res.roll = roll;
        res.crit = this.testCrit(roll, target);
        res.critFail = this.testCritFail(roll, target);
        console.debug(res.critFail, !res.crit, target._defense, res.roll, this._attack, res.critFail || !res.crit && target._defense > res.roll + this._attack);
        res.hit = res.crit || (!res.critFail && target._defense < res.roll + this._attack);
        if (!res.hit) {
            return res as AttackInfo;
        }
        res.rolled = this.rollDamage();
        res.damage = res.rolled.reduce((acc, roll) => acc + roll[1], 0);
        if (res.crit) {
            const critDamage = this.damage.reduce((acc, dice) => acc as number + (typeof dice === 'number' ? dice : dice[0] * dice[1]), 0) as number;
            res.damage += critDamage;
            res.rolled.unshift([0, critDamage])
        }
        target.dealDamage(res.damage);
        return res as AttackInfo
    }

    dealDamage(damage: number) {
        this.hp -= damage;
    }

    rollDrops() {
        return this.drops.filter((drop) => Math.random() < drop[0]).map((drop) => drop[1]);
    }

    rollGold() {
        const [min, max] = this.gold;
        return Math.floor(Math.random() * (max - min)) + min;
    }

    toObject(): EntityDataObject & { hp: number  } {
        return {
            name: this.name,
            id: this.id,
            hp: this.hp,
            maxHp: this.maxHp,
            attack: this.attack,
            defense: this.defense,
            damage: this.damage,
            inventory: this.inventory,
        };
    }

    toString() {
        return `***${this.name}***`;
    }
}

export class PlayerEntity extends Entity implements PlayerEntityDataObject {
    private _mana!: number;
    private _stamina!: number;

    public static async spawn(moi: Message | Interaction, id?: string, hp?: number): Promise<PlayerEntity>  {
        const _player = await new this('player', moi).populate(hp);
        _player._name = _player._player.displayName;
        return _player;
    }

    get mana() { return this._mana };
    get stamina() { return this._stamina };
    private get database() { return database.child('adventuring').child(this._moi.guildId!).child('player') }

    get hp() { return this._hp };
    set hp(value: number) {
        this._hp = value;
        // this.save();
    }

    static validate(obj: any): obj is PlayerEntityDataObject {
        if (!super.validate(obj)) return false;
        for (const num of ['stamina', 'mana']) if (!(num in obj) || typeof (obj as any)[num] !== 'number') return false;
        for (const str of ['playerId']) if (!(str in obj) || typeof (obj as any)[str] !== 'string') return false;
        return true;
    }

    async getTypeData(): Promise<PlayerEntityDataObject> {
        const firebaseData = /* (await this.database.once('value')).val() || */ {} as any;
        return {
            name: '',
            id: '',
            maxHp: firebaseData.maxHp || 10,
            attack: firebaseData.attack || 1,
            defense: firebaseData.defense ||  10,
            damage: firebaseData.damage || [1],
            mana: (await getMana(this._moi, this._player.user, true)).value,
            stamina: 15,
            inventory: (await Inventory.get(this._moi, this._player.user)).items,
        };
    }

    async save() {
        this.database.set(this.toObject());
    }

    // attackEntity(target: Entity): AttackInfo {
    //     const res = super.attackEntity(target);
    //     // if (res.hit) this.inventory;
    //     return res;
    // }

    toObject(): PlayerEntityDataObject & { hp: number; } {
        return {
            ...super.toObject(),
            mana: this.mana,
            stamina: this.stamina,
         };
    }

    toString(): string {
        return `***<@${this._player.id}>***`
    }
}

const readEntityPath = (path: string) => {
    if (statSync(path).isDirectory()) {
        for (const subDir of readdirSync(path)) readEntityPath(`${path}/${subDir}`);
        return;
    }
    const entity = JSON.parse(readFileSync(path, 'utf-8'));
    if (!Entity.validate(entity)) throw new Error(`Invalid Entity: ${path}`);
    entities[entity.id] = entity;
}
readEntityPath('./data/adventuring/entities');
entities.player = {
    name: 'Player',
    id: 'player',
    attack: 0,
    defense: 0,
    maxHp: 0,
    damage: [],
    inventory: [],
}
// console.debug(entities);

// const skeleton = JSON.parse();
// console.debug(skeleton);
// console.debug(Entity.validate(skeleton));


// export const Slime = (hp?: number) => new Entity(ENTITY_TYPES.SLIME);
// export const Skeleton = (hp?: number) => new Entity(ENTITY_TYPES.SKELETON);
// export const Zombie = (hp?: number) => new Entity(ENTITY_TYPES.ZOMBIE);

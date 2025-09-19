import { readdirSync, readFileSync, statSync } from "fs";
import { random_from_array } from "../../common/functions";
import Entity from "./entity/Entity";
import { Interaction, Message, User } from "discord.js";
import { testArgsInObj } from "./common";

type RouteDataObject = {
    id: string;
    name: string;
    encounters: string[];
    level: number;
    cost: number;
};

export const routes: {[id: string]: RouteDataObject} = {};

export default class Route implements RouteDataObject {
    protected _encounters!: string[];
    protected _level!: number;
    protected _cost!: number;
    protected _name!: string;

    get name() { return this._name }
    get id() { return this._id };
    get encounters() { return this._encounters };
    get level() { return this._level };
    get cost() { return this._cost; }

    constructor(protected _id: string, protected _moi: Message | Interaction) {
        const data = this.getRouteData();
        for (const [key, value] of Object.entries(data)) (this as any)['_' + key] = value;
    }

    static validate(obj: any): obj is RouteDataObject {
        if (!testArgsInObj<RouteDataObject>(obj, ['level', 'cost'], 'number')) return false;
        if (!testArgsInObj<RouteDataObject>(obj, ['id', 'name'], 'string')) return false;
        if (!('encounters' in obj) || !Array.isArray(obj.encounters)) return false;
        for (const value of obj.encounters) if (typeof value !== 'string') return false;
        return true;
    }

    getRouteData(): RouteDataObject {
        return routes[this._id];
    }

    encounter() {
        return Entity.spawn(this._moi, random_from_array(this._encounters));
    }

    toString() { return `***${this.name}***`; }
}

const readRoutePath = (path: string) => {
    if (statSync(path).isDirectory()) {
        for (const subDir of readdirSync(path)) readRoutePath(`${path}/${subDir}`);
        return;
    }
    const route = JSON.parse(readFileSync(path, 'utf-8'));
    if (!Route.validate(route)) throw new Error(`Invalid Entity: ${path}`);
    routes[route.id] = route;
}
readRoutePath('./data/adventuring/routes');
console.debug('routes', routes);
import { readdirSync, readFileSync, statSync } from "fs";
import { random_from_array } from "../../common/functions";
import Entity from "./entity/Entity";
import { Interaction, Message, User } from "discord.js";

type RouteDataObject = any;

const routes: {[id: string]: RouteDataObject} = {};

export default class Route implements RouteDataObject {
    protected _encounters!: string[];
    protected _name!: string;

    get name() { return this._name }

    constructor(protected _id: string, protected _moi: Message | Interaction) {
        const data = this.getRouteData();
        for (const [key, value] of Object.entries(data)) (this as any)['_' + key] = value;
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
    // if (!Entity.validate(entity)) throw new Error(`Invalid Entity: ${path}`);
    routes[route.id] = route;
}
readRoutePath('./data/adventuring/routes');
console.debug('routes', routes);
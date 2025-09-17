export type InteractionIdData = {
    command: COMMANDS;
    id: string;
}

export enum COMMANDS {
    ATTACK='attack',
    ROUTE='route',
};

export type RouteStartData = InteractionIdData & {
    command: COMMANDS.ROUTE
}

export type AttackData = InteractionIdData & {
    command: COMMANDS.ATTACK,
    eId: string,
    ehp: string,
    php: string,
}

export default class InteractionId {
    private static validate<T extends InteractionIdData>(obj: Object): obj is T {
        if (!('id' in obj && typeof obj.id === 'string')) return false;
        if (!('command' in obj) || typeof obj.command !== 'string' || !(Object.values(COMMANDS) as string[]).includes(obj.command)) return false;
        return true;
    };

    static customIdToObject<T extends InteractionIdData>(customId: string): T {
        const command = customId.match(/^(.+?)(\?|$)/)?.[1] as T['command'];
        if (!command) throw 'Invalid command'
        customId = customId.replace(new RegExp(`^${command}\\?`), '');
        if (!customId.trim()) throw 'Invalid custom ID';
        const args = customId.split('&').map((str) => str.split('=')) as [keyof T, T[keyof T]][];
        const res = { command } as Partial<T>;
        for (const arg of args) res[arg[0]] = arg[1];
        if (!this.validate<T>(res)) throw ''
        return res;
    }

    static objectToCustomId <T extends InteractionIdData>(obj: T): string {
        const _obj = {...obj} as Partial<T>;
        let res = _obj.command as string;
        delete _obj.command;
        const args = Object.entries(_obj).map(arg => arg.join('=')).join('&');
        if (args.trim()) res += `?${args}`;
        return res;
    }
}
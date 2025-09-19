export type RolledDice = RolledDie[];
export type RolledDie = [sides: number, result: number];
export type Dice = [quantity: number, sides: number]

export const rollDie = (die: number) => Math.floor(Math.random() * die) + 1;
export function rollDice (dice: [number, number]): RolledDice;
export function rollDice (amount: number, sides: number): RolledDice;
export function rollDice (amount: [number, number] | number, sides?: number): RolledDice {
    if (Array.isArray(amount)) [amount, sides] = amount;
    const dice: RolledDice = [];
    for (let i = 0; i < amount; i++) dice.push([sides!, rollDie(sides!)]);
    return dice;
}
type typeofType = 'bigint' | 'boolean' | 'function' | 'number' | 'object' | 'string' | 'symbol' | 'undefined'

export function testArgsInObj<T>(obj: any, args: (keyof T)[], type: typeofType) {
    for (const arg of args) if (!(arg in obj) || typeof obj[arg] !== type) return false;
    return true;
}
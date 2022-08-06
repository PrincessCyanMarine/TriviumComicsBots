import { Collection, Guild, GuildEmoji, PremiumTier } from "discord.js";
import e from "express";
import { copyFile, copyFileSync, existsSync, readdirSync, readFileSync, unlinkSync } from "fs";
import { parse } from "path";
import { alea } from "seedrandom";
import { database } from "..";
import { d20 } from "../clients";
import { asyncForEach, cloneArray } from "../common";
import { random_from_array, say, wait } from "../common/functions";
import { announcementChannelId, TIME, triviumGuildId } from "../common/variables";

const permPath = "./assets/emojis/permanent";
const cycPath = "./assets/emojis/cycled";

export class EmojiCycler {
    private permanent;
    private cycled;
    private changePerCycle = 15;
    private _rotationOffset: undefined | { [name: string]: number } = undefined;
    private offsetDatabaseChild;
    private guild: Guild | undefined;

    constructor(private guildId: string) {
        this.offsetDatabaseChild = database.child("emojiRotation/" + guildId);

        this.cycled = readdirSync(cycPath);
        this.permanent = readdirSync(permPath);

        this.offsetDatabaseChild.on("value", (snapshot) => {
            // console.log(snapshot.val());
            this._rotationOffset = snapshot.val() ?? {};
        });

        // console.log(this.cycled);
        // console.log(this.permanent);
    }

    private async getEmojiRotation() {
        return Object.fromEntries(
            Object.entries((this._rotationOffset ?? (await this.offsetDatabaseChild.once("value")).val() ?? {}) as { [name: string]: number })
        );
    }

    private setEmojiRotation(key: string, value: number) {
        if (!this._rotationOffset) this._rotationOffset = {};
        this._rotationOffset[key] = value;
        return this.offsetDatabaseChild.child(key).set(value);
    }

    private addEmojiRotation(_keys: string[]) {
        // console.log(_keys);
        let keys = _keys.map((key) => parse(key).name);
        // console.log(keys);
        let rotation = this._rotationOffset ?? {};

        for (const key of keys) {
            if (!rotation[key]) rotation[key] = 1;
            else rotation[key]++;
        }
        // console.log(rotation);

        return this.offsetDatabaseChild.set(rotation);
    }

    private getEmojiLimit(tier: PremiumTier) {
        switch (tier) {
            case "NONE":
                return 50;
            case "TIER_1":
                return 100;
            case "TIER_2":
                return 150;
            case "TIER_3":
                return 250;
        }
    }

    private getRandomEmojis = async (emojiLimit: number) =>
        new Promise<string[]>(async (resolve, reject) => {
            try {
                let rotation = await this.getEmojiRotation();
                let emojis: string[] = [];
                let cycled = cloneArray(this.cycled);
                cycled.filter((e) => !(e in rotation)).forEach((e) => (rotation[e] = 1)); // TODO default to 0
                cycled = cycled.sort((a, b) => rotation[a] - rotation[b]);
                // console.log(cycled);
                // console.log(cycled.map((a) => rotation[a]));
                // console.log(cycled);
                let random = alea((await database.child("emojiRotation/timer/" + this.guildId).once("value")).val() || Date.now().valueOf(), {
                    entropy: true,
                });
                const addFromArray = (array: string[], limit: number) => {
                    // console.log(limit, array.length);
                    if (limit >= array.length) {
                        emojis = cloneArray(array);
                        array = [];
                    } else
                        while (emojis.length < limit) {
                            if (array.length <= 0) break;
                            let v = Math.floor(random.double() * emojis.length);
                            let i = v;
                            emojis.push(...array.splice(i, 1));
                        }
                };

                if (emojiLimit >= cycled.length) emojis = cloneArray(cycled);
                else {
                    while (cycled.length > 0 && emojis.length < emojiLimit && rotation[cycled[0]] === 0) emojis.push(...cycled.splice(0, 1));

                    // console.log(emojis);
                    // console.log(cycled.length);
                    let halfCycled = cycled.splice(0, cycled.length / 2);
                    // console.log(halfCycled.length, cycled.length);
                    addFromArray(halfCycled, emojiLimit / 2);
                    cycled = halfCycled?.concat(cycled) || [];
                    addFromArray(cycled, emojiLimit);
                    // while (emojis.length < emojiLimit && (cycled = addFromArray(cycled)).length > 0) {}
                }

                // console.log(emojis);

                this.addEmojiRotation(emojis);
                // console.log(emojis);

                return resolve(emojis);
            } catch (err) {
                reject(err);
            }
        });

    public cycle = (announce?: string) =>
        new Promise(async (resolve, reject) => {
            try {
                if (!this.guild) this.guild = await d20.guilds.fetch(this.guildId);
                let emojiLimit = this.getEmojiLimit(this.guild.premiumTier) - this.permanent.length;
                let emojiManager = this.guild.emojis;
                let emojis = await emojiManager.fetch();
                let newCycled = await this.getRandomEmojis(emojiLimit);

                let emojiNames = emojis.map((emoji) => emoji.name);
                const addEmoji = (path: string, emojiName: string, reason?: string) => {
                    // console.log(emojiName);
                    // return new Promise<undefined>((resolve) => resolve(undefined));
                    if (!emojiNames.includes(emojiName)) {
                        return emojiManager.create(path, emojiName, {
                            reason,
                        });
                    } else return new Promise<undefined>((resolve) => resolve(undefined));
                };

                const deleteEmoji = (toBeDeleted: GuildEmoji[], i = 0) =>
                    new Promise<void>(async (resolve) => {
                        // console.log(toBeDeleted[i].name);
                        await toBeDeleted[i].delete("Cycling");
                        await wait(5000);
                        resolve();
                    });

                const addPerm = async (perm: string[], i: number) => {
                    let emoji = perm[i];
                    await addEmoji(`${permPath}/${emoji}`, parse(emoji).name, "Permanent");
                    await wait(5000);
                    return;
                };

                let added_emojis = [] as GuildEmoji[];
                const addCycled = async (cycled: string[], i: number) => {
                    let emoji = cycled[i];
                    let em = await addEmoji(`${cycPath}/${emoji}`, parse(emoji).name, "Cycling");
                    if (em instanceof GuildEmoji) added_emojis.push(em);
                    await wait(5000);
                    return;
                };

                let tbd = cloneArray(
                    emojis.filter((emoji) => !(this.permanent.includes(`${emoji.name}.png`) || newCycled.includes(`${emoji.name}.png`)))
                );

                await asyncForEach(tbd, deleteEmoji);
                await asyncForEach(this.permanent, addPerm);
                await asyncForEach(newCycled, addCycled);

                if (announce)
                    d20.channels.fetch(announce).then((channel) => {
                        if (channel && channel?.isText())
                            channel
                                .send(`These emojis have just been rotated into discord!\n${added_emojis.map((e) => e.toString()).join(" ")}`)
                                .then(async (m) => {
                                    for (let emoji of added_emojis) {
                                        await m.react(emoji);
                                        await wait(1000);
                                    }
                                });
                    });

                database.child("emojiRotation/timer/" + this.guildId).set(Date.now().valueOf());
            } catch (err) {
                reject(err);
            }
        });
}

// setInterval(() => {
//     database
//         .child("emojiRotation/timer/" + triviumGuildId)
//         .once("value")
//         .then((snapshot) => {
//             let emojiTimer = snapshot.val();
//             if (typeof emojiTimer === "number" && emojiTimer + 2 * TIME.WEEKS < Date.now().valueOf())
//                 new EmojiCycler(triviumGuildId).cycle(announcementChannelId);
//             // TODO ANNOUNCE THE ONES THAT WILL LEAVE, 1 WEEK BEFORE THEY LEAVE
//         });
// }, TIME.HOURS);

// database
//     .child("emojiRotation/timer/" + triviumGuildId)
//     .once("value")
//     .then((snapshot) => {
//         let emojiTimer = snapshot.val();
//         // console.log(emojiTimer);
//     });
// let cycler = new EmojiCycler("999917474885677126");
// let cycler = new EmojiCycler(triviumGuildId);
// cycler.cycle("613507549085302796");
// setInterval(() => {
// cycler.cycle();
// }, 5000);

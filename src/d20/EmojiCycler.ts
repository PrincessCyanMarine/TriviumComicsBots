import { Guild, GuildEmoji, PremiumTier } from "discord.js";
import e from "express";
import { copyFile, copyFileSync, existsSync, readdirSync, readFileSync, unlinkSync } from "fs";
import { parse } from "path";
import { database } from "..";
import { d20 } from "../clients";
import { random_from_array, say } from "../common/functions";
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
        let keys = _keys.map((key) => parse(key).name);
        let rotation = this._rotationOffset ?? {};

        for (const key of keys)
            if (!rotation[key]) rotation[key] = 1;
            else rotation[key]++;
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

    private getRandomEmojis = async (emojiLimit: number) => {
        let rotation = await this.getEmojiRotation();
        let emojis: string[] = [];
        let cycled = this.cycled.map((a) => a);
        cycled.filter((e) => !(e in rotation)).forEach((e) => (rotation[e] = 0));
        // let k = Object.keys(rotation);
        let val = Object.values(rotation);

        let sum = val.reduce((pv, cv) => cv + pv, 0);
        if (sum == 0) sum = val.length;

        // console.log(sum);
        let prev = 0;
        let ind = Object.fromEntries(
            Object.entries(rotation).map(([k, v]) => {
                prev += sum - v;
                return [prev, k];
            })
        );

        for (let i = 0; i < emojiLimit; i++) {
            let r = Math.floor(Math.random() * prev);
            for (const e of Object.keys(ind)) {
                if (parseInt(e) > r) {
                    let c = cycled.splice(cycled.indexOf(ind[e]), 1)[0];
                    emojis.push(c);
                    break;
                }
            }
        }

        this.addEmojiRotation(emojis);

        return emojis;
    };

    public cycle = (announce?: string) =>
        new Promise(async (resolve, reject) => {
            if (!this.guild) this.guild = await d20.guilds.fetch(this.guildId);
            let emojiLimit = this.getEmojiLimit(this.guild.premiumTier) - this.permanent.length;
            let offset = await this.getEmojiRotation();
            let emojiManager = this.guild.emojis;
            let emojis = await emojiManager.fetch();
            let newCycled = await this.getRandomEmojis(emojiLimit);
            // console.log(newCycled);

            this.cycled.forEach((c) => {
                let path = `./assets/emojis/current/${c}`;
                if (!newCycled.includes(c) && existsSync(path)) {
                    // console.log(path);
                    unlinkSync(path);
                }
            });

            let emojiNames = emojis.map((emoji) => emoji.name);
            const addEmoji = (path: string, emojiName: string, reason?: string) => {
                if (!emojiNames.includes(emojiName)) {
                    return emojiManager.create(path, emojiName, {
                        roles: [],
                        reason,
                    });
                } else return undefined;
                // let dist = "./assets/emojis/current/" + emojiName + ".png";
                // if (!existsSync(dist)) {
                //     // console.log(emojiName);
                //     copyFileSync(path, dist);
                // }
            };

            emojis
                .filter((emoji) => !(this.permanent.includes(`${emoji.name}.png`) || newCycled.includes(`${emoji.name}.png`)))
                .forEach((emoji) => emoji.delete("Cycling"));
            this.permanent.forEach((emoji, i) => {
                addEmoji(`${permPath}/${emoji}`, parse(emoji).name);
            });

            Promise.allSettled(newCycled.map((emoji) => addEmoji(`${cycPath}/${emoji}`, parse(emoji).name, "cycling"))).then((e) => {
                let added_emojis = (e.map((e) => (e.status === "fulfilled" ? e.value : undefined)).filter((e) => !!e) as GuildEmoji[]).map((e) =>
                    e.toString()
                );

                if (announce)
                    d20.channels.fetch(announce).then((channel) => {
                        if (channel && channel?.isText())
                            channel.send(`These emojis have just been rotated into discord!\n${added_emojis.join(", ")}`);
                    });
            });

            database.child("emojiRotation/timer/" + triviumGuildId).set(Date.now().valueOf());
        });
}

setInterval(() => {
    database
        .child("emojiRotation/timer/" + triviumGuildId)
        .once("value")
        .then((snapshot) => {
            let emojiTimer = snapshot.val();
            if (typeof emojiTimer === "number" && emojiTimer + 2 * TIME.WEEKS < Date.now().valueOf())
                new EmojiCycler(triviumGuildId).cycle(announcementChannelId);
            // TODO ANNOUNCE THE ONES THAT WILL LEAVE, 1 WEEK BEFORE THEY LEAVE
        });
}, TIME.HOURS);

database
    .child("emojiRotation/timer/" + triviumGuildId)
    .once("value")
    .then((snapshot) => {
        let emojiTimer = snapshot.val();
        console.log(emojiTimer);
    });
// let cycler = new EmojiCycler("999917474885677126");
// cycler.cycle();
// setInterval(() => {
// cycler.cycle();
// }, 5000);

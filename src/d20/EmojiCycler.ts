import { Collection, Guild, GuildEmoji, PremiumTier, Snowflake } from "discord.js";
import e from "express";
import { copyFile, copyFileSync, existsSync, readdirSync, readFileSync, unlinkSync } from "fs";
import { parse } from "path";
import { alea } from "seedrandom";
import { database, testing } from "..";
import { d20, logwebhook } from "../clients";
import { asyncForEach, cloneArray } from "../common";
import { random_from_array, say, wait, weightedRandom } from "../common/functions";
import { TIME } from "../common/variables";

export const permPath = "./assets/emojis/permanent";
export const cycPath = "./assets/emojis/cycled";

const BASE_TIME = 5000;
const MAX_ADDED_TIME = 5000;

const removeExtension = (name: string) => name.replace(/^(.*)\..*$/, (_, $1) => $1);

export class EmojiCycler {
    private permanent;
    private cycled;
    private data?: { timer: number; current: string[] };

    constructor(private guildId: string, private announcementChannelId: string) {
        this.cycled = readdirSync(cycPath);
        this.permanent = readdirSync(permPath);

        database.child("emojiRotation/data/" + this.guildId).once("value", async (snapshot) => {
            this.data = snapshot.val() as { timer: number; current: string[] };
            this.testCycle();
        });
    }

    private async testCycle() {
        console.log("Testing emoji cycle...");
        if (!this.data) {
            this.cycle();
            return;
        }
        const guild = await d20.guilds.fetch(this.guildId);

        console.log(Date.now().valueOf(), this.data.timer + TIME.WEEKS * 1);
        if (Date.now().valueOf() >= this.data.timer + TIME.WEEKS * 1) {
            console.log("Time passed, cycling...");
            await this.cycle();
        } else {
            await this.updateEmojis(
                guild,
                this.data.current.map((e) => ({ emoji: e })),
                false
            );
        }
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

    private async getWeight() {
        let emojis = this.cycled.map((emoji) => {
            return { weight: 100, emoji };
        });
        let stored = (await database.child("emojiRotation/" + this.guildId).once("value")).val() as { [name: string]: number };
        if (stored) {
            for (let emoji of emojis) {
                let s = stored[removeExtension(emoji.emoji)];
                if (s) emoji.weight = s;
            }
        }
        return emojis;
    }

    private async getRandomEmojis(guild: Guild) {
        const limit = this.getEmojiLimit(guild.premiumTier) - this.permanent.length;
        // console.log(limit);
        const weight = await this.getWeight();
        // console.log(weight);
        // console.log(limit, weight.length);
        if (weight.length <= limit) return weight;
        const emojis = [];
        for (let emoji of weight) {
            if (emoji.weight == 100) {
                emojis.push(emoji);
                weight.splice(weight.indexOf(emoji), 1);
            }
            if (emojis.length >= limit || weight.length == 0) return emojis;
        }

        while (emojis.length < limit && emojis.length < this.cycled.length && weight.length > 0) {
            const index = weightedRandom(weight)() as number;
            const emoji = weight[index];
            if (emojis.includes(emoji)) continue;
            emojis.push(emoji);
            weight.splice(index, 1);
        }

        return emojis;
        // console.log(random);
    }

    public async cycle() {
        console.log("Cycling emojis...");
        const guild = await d20.guilds.fetch(this.guildId);

        let emojis = await this.getRandomEmojis(guild);
        this.data = { timer: Date.now().valueOf(), current: emojis.map((e) => e.emoji) };
        await database.child("emojiRotation/data/" + this.guildId).set(this.data);

        let newWeight: { [name: string]: number } = {};
        for (let emoji of emojis) {
            let weight = emoji.weight - 1;
            if (weight <= 0) weight = 99;
            newWeight[
                emoji.emoji.replace(/^(.*)\..*$/, (_, $1) => {
                    return $1;
                })
            ] = weight;
        }
        await database.child("emojiRotation/" + this.guildId).update(newWeight);

        await this.updateEmojis(guild, emojis);
    }

    private async updateEmojis(guild: Guild, emojis: { emoji: string }[], announce = true) {
        let guildEmojis = await guild.emojis.fetch();
        const missingPermanent = this.permanent.filter((e) => !guildEmojis.find((_e) => _e.name == removeExtension(e))).map((e) => ({ emoji: e }));
        if (missingPermanent.length > 0) {
            console.log("Adding missing permanent emojis");
            await this.addEmojis(guild, missingPermanent, permPath);
            await wait(2000);
        }

        let names = emojis.map((e) => e.emoji);
        let toDelete = guildEmojis.filter((e) => !this.permanent.includes(e.name + ".png") && !names.includes(e.name + ".png"));

        let channel = await d20.channels.fetch(this.announcementChannelId);
        if (announce)
            if (toDelete.size > 0 && channel?.isText()) {
                await channel.send(":tada: Emojis are being cycled! :tada:\nThe following emojis will be removed:\n");
                let nextMessage = "";
                {
                    let deleteArray = toDelete.map((e) => e);
                    for (let i = 0; i < deleteArray.length; i++) {
                        nextMessage += "<:" + deleteArray[i].identifier + "> ";
                        if ((i + 1) % 10 == 0) {
                            await channel.send(nextMessage);
                            nextMessage = "";
                        }
                    }
                }
                if (nextMessage != "") await channel.send(nextMessage);
            }

        await this.removeEmojis(toDelete);

        await wait(2000);

        let toAdd = emojis.filter((e) => !guildEmojis.find((_e) => removeExtension(e.emoji) == _e.name));
        await this.addEmojis(guild, toAdd, cycPath);

        guildEmojis = await guild.emojis.fetch();
        console.log(toAdd.length, emojis.length);
        if (announce)
            if (toAdd.length > 0 && channel?.isText()) {
                await channel.send(":tada: The emojis have been cycled! :tada:\nNew emojis:\n");

                let nextMessage = "";
                for (let i = 0; i < toAdd.length; i++) {
                    nextMessage += "<:" + guildEmojis.find((_e) => removeExtension(toAdd[i].emoji) == _e.name)?.identifier + "> ";
                    if ((i + 1) % 10 == 0) {
                        await channel.send(nextMessage);
                        nextMessage = "";
                    }
                }
                if (nextMessage != "") await channel.send(nextMessage);
            }

        let lastTimer = this.data ? this.data.timer : Date.now().valueOf();

        setTimeout(() => this.testCycle(), lastTimer + TIME.WEEKS * 1 - Date.now().valueOf());
        console.log("Next cycle in " + (lastTimer + TIME.WEEKS * 1 - Date.now().valueOf()) / 1000 / 60 / 60 + " hours");

        return { toAdd, toDelete };
    }

    private async addEmojis<T extends { emoji: string }>(guild: Guild, toAdd: T[], path: string) {
        // console.log("Would add");
        // console.log(toAdd.map((e) => e.emoji));
        let webhook = logwebhook(testing);
        const log = (text: string) => {
            console.log(text);
            webhook.send(text);
        };
        log("Adding " + toAdd.length + " emojis...");
        for (const emoji of toAdd) {
            try {
                log("Adding " + emoji.emoji + "...");
                await guild.emojis.create(path + "/" + emoji.emoji, removeExtension(emoji.emoji), { reason: "Emoji rotation" });
                log("Added " + emoji.emoji + "\n");
                await wait(BASE_TIME + Math.random() * MAX_ADDED_TIME);
            } catch (e) {
                console.error("Failed to add " + emoji.emoji);
                console.error(e);
            }
        }
    }

    private async removeEmojis(toDelete: Collection<Snowflake, GuildEmoji>) {
        // console.log("Would delete");
        // console.log(toDelete.map((e) => e.name));
        let webhook = logwebhook(testing);
        const log = (text: string) => {
            console.log(text);
            webhook.send(text);
        };
        log("Deleting " + toDelete.size + " emojis...");
        for (const emoji of toDelete.values()) {
            try {
                log("Deleting " + emoji.name + "...");
                await emoji.delete("Emoji rotation");
                log("Deleted " + emoji.name + "\n");
                await wait(BASE_TIME + Math.random() * MAX_ADDED_TIME);
            } catch (e) {
                console.error("Failed to delete " + emoji.name);
                console.error(e);
            }
        }
    }
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

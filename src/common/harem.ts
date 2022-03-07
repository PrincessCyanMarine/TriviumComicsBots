import { GuildMember, Message, MessageOptions } from "discord.js";
import { database } from "..";
import { eli } from "../clients";

export class Harem {
    kick(id: string) {
        throw new Error("Method not implemented.");
    }

    getMembersMessage(msg: Message): Promise<string | MessageOptions> {
        return new Promise(async (resolve, reject) => {
            if (!this.harem?.members) return resolve("No one has joined your harem yet");
            let guild_members = await msg.guild?.members.fetch();
            resolve(this.harem.members.map((member) => guild_members?.get(member)?.displayName).join("\n"));
        });
    }

    private async push(path: string, value: any) {
        let current = (await database.child(path).once("value")).val();
        let current_len = Array.isArray(current) ? current.length : 0;
        database.child(path + "/" + current_len).set(value);
    }

    async join(id: string) {
        this.push(`harem/${this.guildId}/${id}/members`, this.userId);
        this.push(`${this.path}/isIn`, id);
    }

    private async remove(path: string, value: string) {
        let array: string[] = (await database.child(path).once("value")).val();
        if (!Array.isArray(array)) throw "Not an array";
        database.child(path).set(array.filter((a) => a != value));
    }

    leave(id: string) {
        if (id == "all") {
            this.harem?.isIn?.forEach((h) => {
                this.remove(`harem/${this.guildId}/${h}/members`, this.userId);
            });
            database.child(`${this.path}/isIn`).remove();
        } else {
            this.remove(`harem/${this.guildId}/${id}/members`, this.userId);
            this.remove(`${this.path}/isIn`, id);
        }
    }

    includes(id: string) {
        return this.harem?.members?.includes(id);
    }

    isIn(id: string) {
        return this.harem?.isIn?.includes(id);
    }

    path: string;
    disband() {
        this.harem?.members?.forEach(async (member) => {
            this.remove(`harem/${this.guildId}/${member}/isIn`, this.userId);
        });
        database.child(`${this.path}/members`).remove();
        this.ownsOne = false;
    }

    create() {
        this.ownsOne = true;
    }

    public harem: undefined | HaremInfo;

    private constructor(private guildId: string | null, private userId: string) {
        this.path = `harem/${this.guildId}/${this.userId}`;
        database.child(this.path).on("value", (h) => {
            this.harem = h.val();
        });
    }

    static get(guildId: string | null, userId: string): Promise<Harem> {
        return new Promise(async (resolve, reject) => {
            let instance = new Harem(guildId, userId);
            instance.harem = (await database.child(instance.path).once("value")).val();
            resolve(instance);
        });
    }

    get ownsOne() {
        return this.harem?.ownsOne;
    }

    set ownsOne(value) {
        database.child(`${this.path}/ownsOne`).set(value);
    }
}

type HaremInfo = {
    members?: string[];
    ownsOne: boolean;
    isIn?: string[];
};

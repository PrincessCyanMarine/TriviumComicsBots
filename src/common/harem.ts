import { GuildMember, Message, MessageActionRow, MessageButton, MessageOptions } from "discord.js";
import { database } from "..";
import { eli } from "../clients";

export class Harem {
    unban(id: string) {
        this.remove(`${this.path}/banned`, id)
    }
    ban(id: string) {
        this.push(`${this.path}/banned`, id)
    }

    isBanned(id: string) {
        if (!Array.isArray(this.harem?.banned)) return false;
        return this.harem?.banned?.includes(id);
    }

    getOpenMessage(msg: Message<boolean>): Promise<string | MessageOptions> {
        return new Promise(async (resolve, reject) => {
            resolve({
                components: [
                    new MessageActionRow().addComponents(
                        new MessageButton().setLabel("JOIN").setStyle("SUCCESS").setCustomId(`harem?command=accept_invite&harem_id=${msg.author.id}`)
                    ),
                ],
                content: `${msg.member?.displayName}'s harem is open for anyone`,
            });
        });
    }
    kick(id: string) {
        this.remove(`${this.path}/members`, id);
        this.remove(`harem/${this.guildId}/${id}/isIn`, this.userId);
    }

    getMembersMessage(msg: Message): Promise<MessageOptions> {
        return new Promise(async (resolve, reject) => {
            let harem = msg.mentions.members?.first() ? (await Harem.get(this.guildId, msg.mentions.members.first()!.id)).harem : this.harem;
            let target = msg.mentions.members?.first() ? msg.mentions.members!.first() : msg.member;
            let guild_members = await msg.guild?.members.fetch();
            let content = "";
            content += Array.isArray(harem?.members)
                ? target?.displayName +
                "'s harem\n" +
                harem!.members
                    .concat("297531251081084941")
                    .map((member) => guild_members?.get(member)?.displayName)
                    .join("\n")
                : harem?.ownsOne
                    ? "There's no one on " + target?.displayName + "'s harem"
                    : "";
            content += "\n\n";
            content += Array.isArray(harem?.isIn)
                ? target?.displayName +
                " is a part of\n" +
                harem!.isIn
                    .concat("297531251081084941")
                    .map((member) => guild_members?.get(member)?.displayName)
                    .join("\n")
                : target?.displayName + " hasn't joined any harems";
            let res: MessageOptions = { content };
            resolve(res);
        });
    }

    private async push(path: string, value: any) {
        let current = (await database.child(path).once("value")).val() ?? [];
        let current_len = Array.isArray(current) ? current.length : 0;
        database.child(path + "/" + current_len).set(value);
    }

    async join(id: string) {
        if (id == this.userId || this.isBanned(id) || this.includes(id)) return;
        this.push(`harem/${this.guildId}/${id}/members`, this.userId);
        this.push(`${this.path}/isIn`, id);
    }

    private async remove(path: string, value: string) {
        let array: string[] = (await database.child(path).once("value")).val() ?? [];
        console.log(array)
        if (!Array.isArray(array)) throw "Not an array";
        if (array.length == 0) return;
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
        if (!Array.isArray(this.harem?.members)) return false;
        return this.harem?.members?.includes(id);
    }

    isIn(id: string) {
        if (!Array.isArray(this.harem?.isIn)) return false;
        if (id == "any") return this.harem?.isIn != undefined;
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
        return this.harem?.ownsOne ?? false;
    }

    set ownsOne(value) {
        database.child(`${this.path}/ownsOne`).set(value);
        if (value == false) database.child(`${this.path}/isOpen`).set(false);
    }

    get isOpen() {
        return this.harem?.isOpen ?? false;
    }

    set isOpen(value) {
        database.child(`${this.path}/isOpen`).set(value);
    }
}

type HaremInfo = {
    members?: string[];
    ownsOne: boolean;
    isIn?: string[];
    isOpen?: boolean;
    banned?: string[];
};

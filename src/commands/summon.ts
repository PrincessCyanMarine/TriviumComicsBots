import { userMention } from "@discordjs/builders";
import {
    ButtonInteraction,
    Client,
    Message,
    MessageActionRow,
    MessageAttachment,
    MessageButton,
    MessageEditOptions,
    MessageOptions,
    ReplyOptions,
    TextBasedChannel,
} from "discord.js";
import { readFileSync } from "fs";
import { database } from "..";
import { glitch } from "../attachments";
import { d20, krystal, ray, sadie } from "../clients";
import { random_from_array, say, useMana, wait } from "../common/functions";
import { marineId, notificationChannel, sadieId, triviumGuildId } from "../common/variables";
import { burning } from "../krystal/functions";
import { addExclamationCommand } from "../common";
import { addSadieButtonCommand } from "../interactions/button/sadie";

enum SUMMON_TARGETS {
    // SWITCH = "491029828955537418",
    // POLISHFOX = "450211081869066250",
    // CAFFY = "687830651407564810",
    PC = "763194172202024980",
    // TD = "299874082835529729",
    ACCHAN = "852639258690191370",
    // XBOX = "171294034290016276",
    ROY = "1258452263379406919",
}

export enum SUMMON_NAMES {
    NO,
    WARRANTY,
    CALL_THAT_A_RITUAL,
    FAIL_MISERABLY,
    DENIED,
    CHAIR,
    FAIL,
    CRICKETS,
    UNHEARD,
    VOIDFISH,
    PLANE,
    NOT_A_DODO,
    LITERAL_DODO,
    LEGO,
    RAY,
    KRYSTAL,
    SADIE,
    ELI,
    DODO,
}

export async function summon(moi: Message | ButtonInteraction, options: string[] = []) {
    try {
        if (moi instanceof ButtonInteraction && moi.customId.match(/id=(.+?)(&|$)/)?.[1] != moi.user.id) {
            moi.reply({ content: "You can't summon for someone else", ephemeral: true });
            return;
        }
        const channel = moi.channel;
        if (!channel) throw "Channel not found";
        const author = moi instanceof Message ? moi.author : moi.user;
        let mentioned = moi instanceof Message ? moi.mentions.members?.first()?.id : moi.customId.match(/mentioned=(.+?)(&|$)/)?.[1];
        let previousMessage: Message  | null = moi instanceof ButtonInteraction ? moi.message as Message : null;
        const send = async (
            bot: Client,
            channel: TextBasedChannel | string,
            content: string | MessageOptions,
            delay = 1000,
            reply?: ReplyOptions,
            button: boolean = true
        ) => {
            if (typeof content === "string") content = { content: content } as MessageOptions;
            let components = content.components || [];
            if (button && bot.user!.id === sadieId)
                components.push(
                    new MessageActionRow().addComponents(
                        new MessageButton()
                            .setCustomId("summon?id=" + author.id + (mentioned ? "&mentioned=" + mentioned : ""))
                            .setLabel("SUMMON")
                            .setStyle("PRIMARY")
                    )
                );
            content.components = components;
            if (!content.files) content.files = [];
            if (previousMessage && bot.user!.id != previousMessage.author.id) {
                await previousMessage.delete();
                previousMessage = null;
            }
            if (moi instanceof Message) {
                if (!previousMessage) previousMessage = await say(bot, channel, content, delay, reply);
                else await previousMessage.edit(content as MessageEditOptions);
            } else {
                if (moi.replied) await moi.editReply(content);
                else await moi.update(content as MessageEditOptions);
            }
            await wait(1500);
        };

        // console.log(SUMMON_NAMES);
        let summoned_creature = Math.floor(Math.random() * 21);
        let summoned_name: number | string | undefined = undefined;
        if (options[1] && !isNaN(parseInt(options[1]))) summoned_creature = author.id == marineId ? parseInt(options[1]) : 0;
        if (summoned_creature == 0) {
            await send(sadie, channel, "no", undefined, undefined, false);
            summoned_name = SUMMON_NAMES.NO;
        } else {
            let [canUse, mana] = await useMana(moi, 30);
            if (!canUse) {
                await send(sadie, channel, `Not enough mana to summon!\nSummoning cost: 30\nCurrent mana: ${Math.floor(mana.value)}`);
                return;
            }
            let text = random_from_array([
                `*You draw a magic circle on the ground, consuming 30 mana…*`,
                `*You draw a magic circle on the ground, and pour 30 mana into it*`,
                `*You waste 30 of your hard earned mana to conjure a magic circle*`,
                `Mana go. Circle appear.`,
                `Circle appear. Mana go.`,
            ]);
            await send(
                sadie,
                channel,
                {
                    content: text + `\n(${Math.floor(mana.value)}/${mana.max} mana remaining)`,
                    files: [new MessageAttachment(`./assets/ray/roll/${summoned_creature}.gif`, "Roll.gif")],
                },
                500,
                undefined,
                false
            );
            await wait(2000);
            await send(sadie, channel, "You chant the ancient words of summoning…", 500, undefined, false);
            switch (summoned_creature) {
                case 1:
                    await send(
                        sadie,
                        channel,
                        `[${summoned_creature}] A telephone appears! It starts ringing…\nYou answer the phone. "We\'ve been trying to reach you about your vehicle’s extended warranty. Press one—"\nYou hang up the phone.`,
                        450
                    );
                    summoned_name = SUMMON_NAMES.WARRANTY;
                    break;
                case 2:
                    await send(sadie, channel, `[${summoned_creature}] You call that a ritual?`, 250);
                    summoned_name = SUMMON_NAMES.CALL_THAT_A_RITUAL;
                    break;
                case 3:
                    await send(sadie, channel, `[${summoned_creature}] Your circle glows...\nAnd you fail miserably`, 250);
                    summoned_name = SUMMON_NAMES.FAIL_MISERABLY;
                    break;
                case 4:
                    await send(sadie, channel, `[${summoned_creature}] Denied.`, 250);
                    summoned_name = SUMMON_NAMES.DENIED;
                    break;
                case 5:
                    // TODO readd
                    await send(sadie, channel, "🪑\nYou summoned... A chair?", 250, undefined, false);
                    await send(krystal, channel, { files: [await burning(undefined)] }, 250, undefined, false);
                    await send(sadie, channel, `And there it goes...\n[${summoned_creature}]`, 250);
                    summoned_name = SUMMON_NAMES.CHAIR;
                    break;
                case 6:
                case 7:
                    await send(sadie, channel, `[${summoned_creature}] You fail!`, 250);
                    summoned_name = SUMMON_NAMES.FAIL;
                    break;
                case 8:
                case 9:
                    await send(sadie, channel, `[${summoned_creature}] *Crickets.*`, 250);
                    summoned_name = SUMMON_NAMES.CRICKETS;
                    break;
                case 10:
                case 11:
                    await send(sadie, channel, `[${summoned_creature}] Your cryptic chanting echoes unheard.`, 250);
                    summoned_name = SUMMON_NAMES.UNHEARD;
                    break;
                case 12:
                    await send(
                        sadie,
                        channel,
                        `[${summoned_creature}] The fabric of the universe peels away for just a brief moment, summoning...\n\nA voidfish.\n\nIt hisses angrily at you, before blinking out of existence.`,
                        250
                    );
                    summoned_name = SUMMON_NAMES.VOIDFISH;
                    break;
                case 13:
                    await send(sadie, channel, `[${summoned_creature}] It's a bird! It's a plane! It's—no it's just a plane.`, 250);
                    summoned_name = SUMMON_NAMES.PLANE;
                    break;
                case 14:
                    if (!mentioned)
                        if (moi.guild?.id == triviumGuildId) mentioned = random_from_array(Object.values(SUMMON_TARGETS));
                        else mentioned = author.id;
                    if (mentioned == author.id)
                        await send(
                            sadie,
                            channel,
                            `[${summoned_creature}] ` +
                                "A wild " +
                                userMention(mentioned) +
                                " appears!\n\nWait did you just summon yourself? Is that even possible?",
                            250
                        );
                    else await send(sadie, channel, `[${summoned_creature}] ` + "A wild " + userMention(mentioned) + " appears!", 250);
                    // if (mentioned == SUMMON_TARGETS.SWITCH)
                    //     await send(krystal, channel, {
                    //         files: [await killing(undefined, msg.author, undefined, undefined)],
                    //         content: "We don't have permission to use Merry's art",
                    //     });
                    if (mentioned == "297531251081084941") summoned_name = SUMMON_NAMES.DODO;
                    else if ((await moi.guild?.members.fetch(mentioned))?.permissions.has("KICK_MEMBERS")) summoned_name = "mod/" + mentioned;
                    else summoned_name = "player/" + mentioned;
                    break;
                case 15:
                    await send(sadie, channel, `[${summoned_creature}] ` + "You summoned a bird. It's not a dodo", 300);
                    summoned_name = SUMMON_NAMES.NOT_A_DODO;
                    break;
                case 16:
                case 17:
                    let bird_list: string[] = readFileSync("./birdlist.txt", "utf-8").split("\n");
                    let b = Math.floor(Math.random() * bird_list.length);
                    if (author.id == marineId && !isNaN(parseInt(options[2]))) b = parseInt(options[2]);
                    let bird = bird_list[b].match(/(?<bird>.+?) \(url: (?<url>https:\/\/en.wikipedia.org\/wiki\/.+?)\)/);
                    if (!(bird?.groups && bird.groups.bird && bird.groups.url)) return;
                    await send(
                        sadie,
                        channel,
                        {
                            content:
                                `[${summoned_creature}] ` +
                                "You summoned " +
                                (bird.groups.bird.match(/^[aeiou]/i) ? "an " : "a ") +
                                bird.groups.bird +
                                "!",
                            components: [
                                new MessageActionRow().addComponents(
                                    new MessageButton().setLabel(bird.groups.bird).setStyle("LINK").setURL(bird.groups.url).setEmoji("🐦")
                                ),
                            ],
                        },
                        300
                    );
                    let birdpedia = database.child("birdpedia/" + moi.guild?.id + "/" + author.id + "/" + b);
                    let bd = parseInt((await birdpedia.once("value")).val()) || 0;
                    birdpedia.set(bd + 1);
                    break;
                case 18:
                    await send(sadie, channel, `[${summoned_creature}] ` + "You summoned a literal dodo. Aren’t they extinct?", 300);
                    summoned_name = SUMMON_NAMES.LITERAL_DODO;
                    break;
                case 19:
                    let moderators: string[] | undefined = (await moi.guild?.members.fetch())
                        ?.filter(
                            (m) => !m.user.bot && m.permissions.has("KICK_MEMBERS") && !["297531251081084941", "238481145329745920"].includes(m.id)
                        )
                        .map((m) => m.id);
                    let mod;
                    if (moderators) {
                        mod = random_from_array(moderators);
                        summoned_name = "mod/" + mod;
                        mod = userMention(mod);
                    } else mod = "[INSERT QUEENSBLADE]";
                    await send(sadie, channel, `[${summoned_creature}] ` + "You summoned a servant of Dodo!\nA wild " + mod + " appears!");
                    break;
                case 20:
                    await random_from_array([
                        async () => {
                            await send(
                                sadie,
                                channel,
                                `[${summoned_creature}] ` + "You step on a poisoned lego and die before seeing what you summoned! :GMSadieTheSadist:"
                            );
                            summoned_name = SUMMON_NAMES.LEGO;
                        },
                        async () => {
                            await send(sadie, channel, `[${summoned_creature}] ` + "A wild Ray appears!");
                            summoned_name = SUMMON_NAMES.RAY;
                        },
                        // TODO readd
                        async () => {
                            await send(sadie, channel, "A wild Krystal appears!", undefined, undefined, false);
                            await send(
                                krystal,
                                channel,
                                { content: "W̸̡̡̺̠̝̎̆ě̶̲́̒͒l̴̮̰̝͑́͛c̶̼̔́̿̆o̷̜̠̙̭͛͗̀͗ͅm̶̭͚̌e̵̤͕͗̒ ̸͉̺̻̔͐̉̂͐̉t̸̹͖̘̻̞́o̴̗̽͆ ̵̢̛͓̻̩̩̮̅t̴̬̯̲̍̏͗h̷̝̎͛é̷̯̤̤͗̑ ̷̡͉̙̱̲̿̓g̴͕͍͔̣̊́̀̾͝a̴̱̭͒͝m̷̢͕̜͗ȩ̶̹̈́̾̈͌ ̵̤̩̹̍͝o̷̺̎f̵̯̌͑̈́̚ ̸̡͓̞̯̩̃̏̿̚l̵̰̮̱̿́i̷͙̫̩͙̔́̀̄̕f̵̖͔̜́̾͋͘͝e̵͉͓̾̕͜!̵̛̥̓̀́͐̈́" + `\n[${summoned_creature}]`, files: [glitch] },
                                250
                            );
                            summoned_name = SUMMON_NAMES.KRYSTAL;
                        },
                        async () => {
                            await send(sadie, channel, `[${summoned_creature}] ` + "A wild Sadie appears!\n\nWait that's me");
                            summoned_name = SUMMON_NAMES.SADIE;
                            // summoned_name = "sadie";
                        },
                        async () => {
                            await send(sadie, channel, `[${summoned_creature}] ` + "A wild Eli appears!");
                            summoned_name = SUMMON_NAMES.ELI;
                            // summoned_name = "eli";
                        },
                        async () => {
                            await send(sadie, channel, `[${summoned_creature}] ` + "You summoned " + userMention("297531251081084941") + "!");
                            summoned_name = SUMMON_NAMES.DODO;
                            // summoned_name = "DODO!!!";
                        },
                    ])();
                    break;
            }
        }
        if (summoned_name) {
            let db = database.child("summons/" + moi.guild?.id + "/" + author.id + "/" + summoned_name);
            let a = parseInt((await db.once("value")).val()) || 0;
            db.set(a + 1);
        }
    } catch (err) {
        console.error(err);
        if (typeof err == "string") {
            let c = await d20.channels.fetch(notificationChannel);
            if (c?.isText()) c.send(err);
        }
    }
}

const get_summon_message = (action: string, times: number = 0, result?: string, plural?: string) =>
    times == 0 ? "" : action + " " + times + " " + (plural ? (times == 1 ? result : plural) : result + (result && times == 1 ? "" : "s")) + "\n";

export async function summonHistory(msg: Message) {
    let target = msg.mentions.members?.first() || msg.member;
    if (!target) {
        msg.reply("You need to mention a user to see their summon history");
        return;
    }
    let text = "";
    let summoned = (await database.child("summons/" + msg.guild?.id + "/" + target.id).once("value")).val() || {};
    let summoned_birds: { bird_id: number } = (await database.child("birdpedia/" + msg.guild?.id + "/" + target.id).once("value")).val() || {};
    let summoned_players: number[] = summoned && "player" in summoned ? Object.values(summoned["player"]) || [] : [];
    let summoned_mods: number[] = summoned && "mod" in summoned ? Object.values(summoned["mod"]) || [] : [];
    let birds = 0;
    let players = 0;
    let mods = 0;
    Object.values(summoned_birds).forEach((bird) => (birds += bird));
    summoned_players.forEach((player) => (players += player));
    summoned_mods.forEach((mod) => (mods += mod));
    text += get_summon_message("Was denied", summoned[SUMMON_NAMES.NO], "time");
    text += get_summon_message("Was reached to talk about their car's extended warranty", summoned[SUMMON_NAMES.WARRANTY], "time");
    text += get_summon_message("Performed", summoned[SUMMON_NAMES.CALL_THAT_A_RITUAL], "shitty ritual");
    text += get_summon_message("Failed miserably", summoned[SUMMON_NAMES.FAIL_MISERABLY], "time");
    text += get_summon_message("Was denied", summoned[SUMMON_NAMES.DENIED], "time");
    text += get_summon_message("Summoned", summoned[SUMMON_NAMES.CHAIR], "chair");
    text += get_summon_message("Heard", summoned[SUMMON_NAMES.CRICKETS], "cricket");
    text += get_summon_message("Wasn't heard", summoned[SUMMON_NAMES.UNHEARD], "time");
    text += get_summon_message("Summoned", summoned[SUMMON_NAMES.VOIDFISH], "voidfish", "voidfish");
    text += get_summon_message("Summoned", summoned[SUMMON_NAMES.PLANE], "plane");
    text += get_summon_message("Summoned", (summoned[SUMMON_NAMES.NOT_A_DODO] || 0) + birds, "regular bird");
    text += get_summon_message("Summoned", summoned[SUMMON_NAMES.LITERAL_DODO], "dodo");
    text += get_summon_message("Stepped on", summoned[SUMMON_NAMES.LEGO], "poisoned lego");
    text += get_summon_message("Summoned Ray", summoned[SUMMON_NAMES.RAY], "time");
    text += get_summon_message("Summoned Krystal", summoned[SUMMON_NAMES.KRYSTAL], "time");
    text += get_summon_message("Summoned Sadie", summoned[SUMMON_NAMES.SADIE], "time");
    text += get_summon_message("Summoned Eli", summoned[SUMMON_NAMES.ELI], "time");
    text += get_summon_message("Summoned Dodo", summoned[SUMMON_NAMES.DODO], "time");
    text += get_summon_message("Summoned", players, "player");
    text += get_summon_message("Summoned", mods, "moderator");
    say(ray, msg.channel, text == "" ? `${target.displayName} hasn't summoned anything yet` : `${target.displayName}\n\`\`\`\n` + text + "```");
}

addExclamationCommand("summon", summon);
addExclamationCommand(["summons", "summoned"], summonHistory);
addSadieButtonCommand("summon", summon);

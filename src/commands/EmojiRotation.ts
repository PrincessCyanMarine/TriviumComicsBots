import { database } from "..";
import { d20 } from "../clients";
import { addExclamationCommand } from "../common";
import { say, wait, weightedRandom } from "../common/functions";
import { announcementChannelId, dodoId, marineId, triviumGuildId } from "../common/variables";
import {
    ButtonInteraction,
    Collection,
    Emoji,
    Guild,
    GuildEmoji,
    Interaction,
    InteractionReplyOptions,
    InteractionUpdateOptions,
    Message,
    MessageActionRow,
    MessageButton,
    MessageEditOptions,
    MessageEmbed,
    MessageOptions,
    Modal,
    ModalActionRowComponent,
    ModalSubmitInteraction,
    PremiumTier,
    TextChannel,
    TextInputComponent,
} from "discord.js";
import { addD20ButtonCommand } from "../interactions/button/d20";
import { existsSync, readdirSync } from "fs";
import { Image, createCanvas, loadImage } from "canvas";
import { TextInputStyles } from "discord.js/typings/enums";
import { addD20ModalCommand } from "../interactions/modal/d20";

const emptyMessage = {
    content: null,
    components: [],
    embeds: [],
    files: [],
};

const permanentPath = "./assets/emojis/permanent";
const cycledPath = "./assets/emojis/cycled";

interface EmojiRotationData {
    toBeAdded: string[];
    timer: number;
    removed?: string[];
    added?: string[];
}

const removeExtension = (name: string) => name.replace(/^(.*)\..*$/, (_, $1) => $1);

const getRemotion = (guildEmojiKeys: string[], rotation: EmojiRotationData) => {
    let cleanedEmojis = rotation.toBeAdded.map((e) => removeExtension(e));
    return guildEmojiKeys.filter((e) => !cleanedEmojis.includes(e));
};
const getNew = (guildEmojiKeys: string[], rotation: EmojiRotationData) => {
    return rotation.toBeAdded.filter((e) => !guildEmojiKeys.includes(removeExtension(e)));
};

const createEmojiMessageImage = async (guildEmojis: { [name: string]: GuildEmoji }, rotation: EmojiRotationData) => {
    const MAX_PER_LINE = 10;
    let SIZE = 128;
    let GAP = 16;
    let guildEmojiKeys = Object.keys(guildEmojis);
    let toBeRemoved = getRemovedURLs(guildEmojis, rotation);
    if (rotation.removed) toBeRemoved.push(...rotation.removed);
    let length = rotation.toBeAdded.length + toBeRemoved.length;
    let legend = await loadImage("./assets/d20/emoji_rotation/legend.png");
    let canvas = createCanvas(
        Math.max(legend.width, GAP * 2 + (SIZE + GAP) * Math.min(MAX_PER_LINE, length)),
        GAP + (SIZE + GAP) * Math.ceil(length / MAX_PER_LINE) + legend.height
    );
    let ctx = canvas.getContext("2d");
    // ctx.fillStyle = "#36393f";
    // ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    let addedIcon = await loadImage("./assets/d20/emoji_rotation/added.png");
    let removedIcon = await loadImage("./assets/d20/emoji_rotation/removed.png");
    let lockIcon = await loadImage("./assets/d20/emoji_rotation/lock.png");
    let newIcon = await loadImage("./assets/d20/emoji_rotation/new.png");
    let removeIcon = await loadImage("./assets/d20/emoji_rotation/remove.png");
    const drawEmoji = async (index: number, url?: string) => {
        let perm = false;
        let emoji;
        let img;
        if (!url) {
            emoji = rotation.toBeAdded[index];
            if (existsSync(permanentPath + "/" + emoji)) {
                img = await loadImage(permanentPath + "/" + emoji);
                perm = true;
            } else if (existsSync(cycledPath + "/" + emoji)) img = await loadImage(cycledPath + "/" + emoji);
            else return;
        } else img = await loadImage(url);
        if (!img) return;
        let width = img.width > img.height ? SIZE : (SIZE * img.width) / img.height;
        let height = img.width > img.height ? (SIZE * img.height) / img.width : SIZE;
        let _x = GAP + (SIZE + GAP) * (index % MAX_PER_LINE);
        let x = _x + (SIZE - width) / 2;
        let _y = GAP + (SIZE + GAP) * Math.floor(index / MAX_PER_LINE);
        let y = _y + (SIZE - height) / 2;
        await ctx.drawImage(img, x, y, width, height);
        if (emoji) {
            if (perm) await ctx.drawImage(lockIcon, _x, _y, SIZE, SIZE);
            if (!guildEmojiKeys.includes(removeExtension(emoji))) await ctx.drawImage(newIcon, _x, _y, SIZE, SIZE);
            if (rotation.added?.includes(removeExtension(emoji))) await ctx.drawImage(addedIcon, _x, _y, SIZE, SIZE);
        } else {
            if (url && rotation.removed?.includes(url)) await ctx.drawImage(removedIcon, _x, _y, SIZE, SIZE);
            else await ctx.drawImage(removeIcon, _x, _y, SIZE, SIZE);
        }
    };
    for (let i in rotation.toBeAdded) await drawEmoji(parseInt(i));

    for (let i in toBeRemoved) {
        let index = rotation.toBeAdded.length + parseInt(i);
        await drawEmoji(index, toBeRemoved[i]);
    }

    await ctx.drawImage(legend, (canvas.width - legend.width) / 2, canvas.height - legend.height);

    return canvas.toBuffer();
};

const createMessage = async (moi: Message | ButtonInteraction): Promise<MessageOptions | string> => {
    let author = moi instanceof Message ? moi.author : moi.user;
    let channel = moi instanceof Message ? moi.channel : moi.channel;
    let guild = moi.guild;
    if (!author || !channel || !guild) throw "Something went wrong";
    // if (![marineId, dodoId].includes(author.id)) {
    //     return "You don't have permission to use that command";
    // }
    const data = await getRotationData(guild);
    let components: MessageActionRow[] = [];
    let content = undefined;
    let embeds: MessageEmbed[] = [];
    let buttons = new MessageActionRow();
    let files = [];
    if (!data || !data.toBeAdded || data.toBeAdded.length == 0) {
        content = "There are no emojis in rotation in this server";
        buttons.addComponents(new MessageButton().setCustomId("rotation_roll").setLabel("ROLL").setStyle("PRIMARY").setEmoji("🎲"));
    } else {
        let guildEmojis = await getGuildEmojis(guild);
        let guildEmojiKeys = Object.keys(guildEmojis);
        let willRemove = getRemotion(guildEmojiKeys, data).length > 0;
        files.push(await createEmojiMessageImage(guildEmojis, data));
        content = "These are the emojis in rotation in this server";
        buttons.addComponents(new MessageButton().setCustomId("rotation_roll").setLabel("REROLL").setStyle("PRIMARY").setEmoji("🎲"));
        if (willRemove)
            buttons.addComponents(
                new MessageButton().setCustomId("rotation_removal_request").setLabel("REMOVE EXTRAS").setStyle("SUCCESS").setEmoji("❌")
            );
        else {
            let willAdd = getNew(guildEmojiKeys, data).length > 0;
            if (willAdd)
                buttons.addComponents(
                    new MessageButton().setCustomId("rotation_add_request").setLabel("ADD EMOJIS").setStyle("SUCCESS").setEmoji("🆕")
                );
            else content = "\nThere are no emojis to add nor remove";
        }
    }
    buttons.addComponents(new MessageButton().setCustomId("rotation_announce_request").setLabel("ANNOUNCE").setStyle("DANGER").setEmoji("📢"));
    buttons.addComponents(new MessageButton().setCustomId("rotation_message_reload").setLabel("RELOAD").setStyle("SECONDARY").setEmoji("🔄"));
    components.push(buttons);
    return { content, components, embeds, files } as MessageOptions;
};

addExclamationCommand("rotate", async (msg, options) => {
    if (tryDeny(msg)) return;
    let message = await createMessage(msg);
    say(d20, msg.channel, message);
});

addD20ButtonCommand("rotation_roll", async (interaction) => {
    if (tryDeny(interaction)) return;
    let msg = interaction.message as Message;
    if (!interaction.guild) {
        interaction.update("Something went wrong");
        return;
    }
    try {
        await interaction.update({ ...emptyMessage, content: "Rolling rotation..." });
        await rollRotation(interaction.guild);
        await msg.edit({ content: "Rotation rolled\nReloading Message..." });
    } catch (err) {
        await msg.edit({ ...emptyMessage, content: "Something went wrong while creating the emoji rotation" });
        await wait(500);
    } finally {
        await msg.edit((await createMessage(interaction)) as MessageEditOptions);
    }
});

const _reloadMessage = async (interaction: ButtonInteraction, content = "Reloading message...", clear = false) => {
    if (tryDeny(interaction)) return;
    if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();
    await interaction.editReply(clear ? { ...emptyMessage, content } : { content });
    await interaction.editReply(await createMessage(interaction));
};
const addRequestButton = (command: string, content: string, callback: (interaction: ButtonInteraction) => Promise<void>) => {
    addD20ButtonCommand("rotation_" + command + "_request", async (interaction) => {
        if (tryDeny(interaction)) return;
        let components = [];
        let buttons = new MessageActionRow();
        buttons.addComponents(
            new MessageButton()
                .setCustomId("rotation_" + command + "_confirm")
                .setLabel("CONFIRM")
                .setStyle("SUCCESS")
                .setEmoji("✅")
        );
        buttons.addComponents(new MessageButton().setCustomId("rotation_cancel").setLabel("CANCEL").setStyle("DANGER").setEmoji("❌"));
        components.push(buttons);
        interaction.update({ components, content });
    });
    addD20ButtonCommand("rotation_" + command + "_confirm", callback);
};

addD20ButtonCommand("rotation_message_reload", async (interaction) => _reloadMessage(interaction, undefined, true));
addD20ButtonCommand("rotation_announce_request", async (interaction) => {
    if (tryDeny(interaction)) return;
    let modal = new Modal().setTitle("ANNOUNCE").setCustomId("rotation_announce_confirm");
    let messageTextInput = new TextInputComponent()
        .setCustomId("message")
        .setPlaceholder("Message to announce")
        .setMinLength(1)
        .setMaxLength(2000)
        .setValue(":tada: The emojis have been cycled! :tada:")
        .setRequired(true)
        .setStyle(TextInputStyles.PARAGRAPH as number)
        .setLabel("Message to announce");
    let channelIdTextInput = new TextInputComponent()
        .setCustomId("channelId")
        .setPlaceholder("Channel ID")
        .setMinLength(0)
        .setMaxLength(36)
        .setRequired(true)
        .setStyle(TextInputStyles.SHORT as number)
        .setLabel("Channel ID");
    if (interaction.guildId == triviumGuildId) channelIdTextInput.setValue(announcementChannelId);
    else channelIdTextInput.setValue(interaction.channelId);
    modal.addComponents(new MessageActionRow<ModalActionRowComponent>().addComponents(messageTextInput));
    modal.addComponents(new MessageActionRow<ModalActionRowComponent>().addComponents(channelIdTextInput));
    interaction.showModal(modal);
});

addD20ModalCommand("rotation_announce_confirm", async (interaction) => {
    if (tryDeny(interaction)) return;
    if (!interaction.guild) {
        interaction.reply({ content: "Something went wrong", ephemeral: true });
        return;
    }
    let content = interaction.components[0].components[0].value;
    let channelId = interaction.components[1].components[0].value;
    let channel = await d20.channels.fetch(channelId);
    if (!channel || !(channel instanceof TextChannel)) {
        interaction.reply({ content: "Invalid channel ID", ephemeral: true });
        return;
    }
    if (interaction.guildId != channel.guildId) {
        interaction.reply({ content: "Channel must be in the same server", ephemeral: true });
        return;
    }
    let files = [];
    await interaction.reply({ content: `Making announcement... (activated by ${interaction.user})`, ephemeral: false });
    files.push(await createEmojiMessageImage(await getGuildEmojis(interaction.guild), await getRotationData(interaction.guild)));
    let msg = await channel.send({ content, files });
    // await msg.react("🎲");
    await interaction.editReply({ content: `Announcement made!!! (activated by ${interaction.user})` });
});

addRequestButton("removal", 'Are you sure you want to remove the emojis marked with an "X" from the server? (irreversible)', async (interaction) => {
    if (tryDeny(interaction)) return;
    if (!interaction.guild) {
        await _reloadMessage(interaction, "Something went wrong...\nReloading message...");
        return;
    }
    interaction.update({ ...emptyMessage, content: "Removing additional emojis..." });
    let rotation = await getRotationData(interaction.guild);
    let guildEmojis = await getGuildEmojis(interaction.guild);
    let toBeRemoved = getRemotion(Object.keys(guildEmojis), rotation);
    if (toBeRemoved.length == 0) {
        await _reloadMessage(interaction, "No emojis to remove\nReloading message...");
        return;
    }
    let cleanedPermanent = readdirSync(permanentPath).map((e) => removeExtension(e));
    let cleanedCycled = readdirSync(cycledPath).map((e) => removeExtension(e));

    for (let emoji of toBeRemoved) {
        let guildEmoji = guildEmojis[emoji];
        let url;
        {
            if (cleanedPermanent.includes(emoji)) url = permanentPath + "/" + emoji + ".png";
            else if (cleanedCycled.includes(emoji)) url = cycledPath + "/" + emoji + ".png";
            else url = guildEmojis[emoji]?.url;
        }
        await database.child("emojiRotation/data/" + interaction.guild.id + "/removed").push(url);
        await guildEmoji.delete("Emoji rotation removal stage");
        await interaction.editReply({ ...((await createMessage(interaction)) as MessageOptions), components: [] });
        await wait(1000 + Math.random() * 1000);
    }
    await _reloadMessage(interaction, "All addtional emojis removed\nReloading message...");
});

addRequestButton("add", 'Are you sure you want to add the emojis marked with an "+" to the server? (will take some time...)', async (interaction) => {
    if (tryDeny(interaction)) return;
    if (!interaction.guild) {
        _reloadMessage(interaction, "Something went wrong...\nReloading message...");
        return;
    }

    interaction.update({ ...emptyMessage, content: "Adding new emojis..." });
    let rotation = await getRotationData(interaction.guild);
    let guildEmojis = await getGuildEmojis(interaction.guild);
    let toBeRemoved = getRemotion(Object.keys(guildEmojis), rotation);
    if (toBeRemoved.length > 0) {
        _reloadMessage(interaction, "There are emojis to remove\nReloading message...");
        return;
    }
    let toBeAdded = getNew(Object.keys(guildEmojis), rotation);
    if (toBeAdded.length == 0) {
        _reloadMessage(interaction, "No emojis to add\nReloading message...");
        return;
    }
    // toBeAdded = toBeAdded.splice(0, 5);

    for (let emoji of toBeAdded) {
        // await guildEmojis[emoji].delete();
        let path;
        if (existsSync(permanentPath + "/" + emoji)) {
            path = permanentPath + "/" + emoji;
        } else if (existsSync(cycledPath + "/" + emoji)) path = cycledPath + "/" + emoji;
        else continue;
        let cleanedEmoji = removeExtension(emoji);
        await interaction.guild.emojis.create(path, cleanedEmoji, { reason: "Emoji rotation creation stage" });
        await database.child("emojiRotation/data/" + interaction.guild.id + "/added").push(cleanedEmoji);
        await interaction.editReply({ ...((await createMessage(interaction)) as MessageOptions), components: [] });
        await wait(1000 + Math.random() * 1000);
    }
    _reloadMessage(interaction, "All new emojis added\nReloading message...");
});

addD20ButtonCommand("rotation_cancel", async (interaction) => _reloadMessage(interaction));

const rollRotation = async (guild: Guild): Promise<EmojiRotationData> => {
    let rotation: EmojiRotationData = {
        toBeAdded: [],
        timer: Date.now().valueOf(),
    };

    const permanent = readdirSync(permanentPath);
    const cycled = readdirSync(cycledPath);

    let emojis = [];
    emojis.push(...permanent);
    let limit = getEmojiLimit(guild.premiumTier) - permanent.length;
    if (emojis.length >= limit) {
        emojis.sort(() => Math.random() - 0.5);
        rotation.toBeAdded = emojis.splice(0, limit);
        database.child(`emojiRotation/data/${guild.id}`).set(rotation);
        return rotation;
    }

    let randomCycled = await getRandomCycledEmojis(guild, permanent, cycled);
    emojis.push(...randomCycled.map((emoji) => emoji.emoji));
    rotation.toBeAdded = emojis;
    await database.child(`emojiRotation/data/${guild.id}`).set(rotation);
    await updateWeights(guild, randomCycled);
    return rotation;
};

const getEmojiLimit = (tier: PremiumTier) => {
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
};

const getRandomCycledEmojis = async (guild: Guild, permanent: string[], cycled: string[]) => {
    const limit = getEmojiLimit(guild.premiumTier) - permanent.length;
    const emojis: {
        weight: number;
        emoji: string;
    }[] = [];
    const weight = await getWeight(cycled, guild.id);
    if (weight.length <= limit) return weight;
    // for (let emoji of weight) {
    //     if (emoji.weight == 100) weight.splice(weight.indexOf(emoji), 1);
    // }

    while (emojis.length < limit && emojis.length < cycled.length && weight.length > 0) {
        const index = weightedRandom(weight)() as number;
        const emoji = weight[index];
        if (emojis.includes(emoji)) continue;
        emojis.push(emoji);
        weight.splice(index, 1);
    }

    return emojis;
};

const getWeight = async (cycled: string[], guildId: string) => {
    let emojis = cycled.map((emoji) => {
        return { weight: 100, emoji };
    });
    let stored = (await database.child("emojiRotation/" + guildId).once("value")).val() as { [name: string]: number };
    if (stored) {
        for (let emoji of emojis) {
            let s = stored[removeExtension(emoji.emoji)];
            if (s) emoji.weight = s;
        }
    }
    return emojis;
};

const getRotationData = async (guildOrId: Guild | string) => {
    let res = await (await database.child(`emojiRotation/data/${typeof guildOrId == "string" ? guildOrId : guildOrId.id}`).once("value")).val();

    if (res) {
        if (res.added) res.added = Object.values(res.added);
        if (res.removed) res.removed = Object.values(res.removed);
    }

    return res as EmojiRotationData;
};
const getGuildEmojis = async (guild: Guild) => {
    let guildEmojis: { [name: string]: GuildEmoji } = {};
    let _guildEmojis = (await guild.emojis.fetch()).map((e) => e);
    for (let emoji of _guildEmojis) {
        if (!emoji.name) continue;
        guildEmojis[emoji.name] = emoji;
    }
    return guildEmojis;
};
const getRemovedURLs = (guildEmojis: { [name: string]: GuildEmoji }, rotation: EmojiRotationData) => {
    let guildEmojiKeys = Object.keys(guildEmojis);
    let cleanedPermanent = readdirSync(permanentPath).map((e) => removeExtension(e));
    let cleanedCycled = readdirSync(cycledPath).map((e) => removeExtension(e));
    let toBeRemoved = getRemotion(guildEmojiKeys, rotation).map((e) => {
        if (cleanedPermanent.includes(e)) return permanentPath + "/" + e + ".png";
        if (cleanedCycled.includes(e)) return cycledPath + "/" + e + ".png";
        return guildEmojis[e]?.url;
    });
    return toBeRemoved;
};

const _isMessage = (moi: Message<boolean> | ButtonInteraction | ModalSubmitInteraction): moi is Message => moi instanceof Message;
const tryDeny = (moi: ButtonInteraction | ModalSubmitInteraction | Message) => {
    if (_isMessage(moi) ? moi.member?.permissions.has("MANAGE_EMOJIS_AND_STICKERS") : moi.memberPermissions?.has("MANAGE_EMOJIS_AND_STICKERS"))
        return false;
    let message = { content: "You must have manage emojis and stickers permission to use this button" };
    if (_isMessage(moi)) moi.reply(message);
    else moi.reply({ ...message, ephemeral: true });
    return true;
};
const updateWeights = async (
    guild: Guild,
    emojis: {
        weight: number;
        emoji: string;
    }[]
) => {
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
    await database.child("emojiRotation/" + guild.id).update(newWeight);
    return;
};

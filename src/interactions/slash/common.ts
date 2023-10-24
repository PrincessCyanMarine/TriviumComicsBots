import { SlashCommandBuilder } from "@discordjs/builders";
import {
    CacheType,
    Client,
    CommandInteraction,
    Guild,
    GuildMember,
    Interaction,
    InteractionReplyOptions,
    MessagePayload,
    TextChannel,
} from "discord.js";
import { clients } from "../../clients";
import { testing } from "../..";
import { testGuildId } from "../../common/variables";
import { BotNames } from "../../model/botData";
function testvalid(interaction: Interaction): boolean {
    if (!interaction.channel?.isText()) return false;
    if (interaction.member && !(interaction.member instanceof GuildMember)) return false;
    if (
        interaction.channel instanceof TextChannel &&
        interaction.member &&
        !interaction.channel.permissionsFor(interaction.member).has("SEND_MESSAGES")
    )
        return false;
    return true;
}
export function reply(interaction: CommandInteraction, message: string | InteractionReplyOptions | MessagePayload, exclusive: boolean = false) {
    return new Promise((resolve, reject) => {
        if (!testvalid) return reject("Error!");
        if (typeof message == "string") message = { content: message, ephemeral: exclusive };
        let fun;
        if (interaction.replied || interaction.deferred) fun = interaction.editReply(message);
        else fun = interaction.reply(message);
        fun.then(resolve).catch(reject);
    });
}

export function followup(interaction: CommandInteraction, message: string, exclusive: boolean = false) {
    return new Promise((resolve, reject) => {
        if (!testvalid) return reject("Error!");
        interaction.followUp({ content: message, ephemeral: exclusive }).then(resolve).catch(reject);
    });
}

export const removeCommandFromAllGuilds = async (bot: Client, command: SlashCommandBuilder) => {
    let commands = await bot.application?.commands.fetch();
    commands?.delete(command.name);
};

export const addCommandToGuild = async (guild: Guild, command: SlashCommandBuilder) => {
    let commands = await guild.commands.fetch();
    commands.delete(command.name);
    console.log(`Adding command ${command.name} to guild ${guild.name} (${guild.id})}`);
    guild.commands.create(command.toJSON());
};

export const slash_commands: Record<
    BotNames,
    { name: string; callback: (interaction: CommandInteraction<CacheType>, startTime: number) => Promise<void> }[]
> = {
    sadie: [],
    d20: [],
    cerberus: [],
    common: [],
    eli: [],
    krystal: [],
    ray: [],
    siegfried: [],
};

export const addSlashCommand = async (
    botName: keyof typeof slash_commands,
    command: SlashCommandBuilder,
    callback: (interaction: CommandInteraction<CacheType>, startTime: number) => Promise<void>,
    addToGuilds?: string[]
) => {
    let bot = clients[botName];
    // console.log("Adding " + command.name + " command to " + botName);
    if (testing) {
        let guild = await bot.guilds.fetch(testGuildId);
        addCommandToGuild(guild, command);
    } else {
        let guilds = await bot.guilds.fetch();
        if (addToGuilds) guilds = guilds.filter((guild) => addToGuilds.includes(guild.id));
        for (let guild of guilds.values()) {
            await addCommandToGuild(await guild.fetch(), command);
        }
    }

    slash_commands[botName] = slash_commands[botName].filter((c) => c.name != command.name);
    slash_commands[botName].push({
        name: command.name,
        callback,
    });
};

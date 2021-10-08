import { CommandInteraction, GuildMember, Interaction, TextChannel } from "discord.js";
function testvalid(interaction: Interaction): boolean {
    if (!interaction.channel?.isText()) return false;
    if (interaction.member && !(interaction.member instanceof GuildMember)) return false;
    if (interaction.channel instanceof TextChannel && interaction.member && !interaction.channel.permissionsFor(interaction.member).has('SEND_MESSAGES')) return false;
    return true;
}
export function reply(interaction: CommandInteraction, message: string, exclusive: boolean = false) {
    return new Promise((resolve, reject) => {
        if (!testvalid) return reject('Error!');
        interaction
            .reply({ content: message, ephemeral: exclusive })
            .then(resolve)
            .catch(reject);
    })
}

export function followup(interaction: CommandInteraction, message: string, exclusive: boolean = false) {
    return new Promise((resolve, reject) => {
        if (!testvalid) return reject('Error!');
        interaction
            .followUp({ content: message, ephemeral: exclusive })
            .then(resolve)
            .catch(reject);
    })
}

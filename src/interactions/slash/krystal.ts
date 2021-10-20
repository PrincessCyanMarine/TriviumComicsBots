import { CommandInteraction } from "discord.js";
import { testing } from "../..";
import { krystal, mod_alert_webhook, ray } from "../../clients";
import { say } from "../../common/functions";
import { ignore_channels } from "../../common/variables";
import { followup, reply } from "./common";


krystal.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand() || !interaction.channel) return;
    if (ignore_channels.includes(interaction.channelId)) { reply(interaction, 'Please try in another channel', true); return; }

    switch (interaction.commandName) {
        case 'whisper':
            whisper(interaction);
            break;
    };
});

async function whisper(interaction: CommandInteraction) {
    if (!interaction.isCommand() || !interaction.channel) return;
    let whisper = interaction.options.get('whisper')?.value;
    if (!whisper || typeof whisper != 'string') { reply(interaction, 'Something went wrong'); return; }
    let snitch = Math.floor(Math.random() * 3);
    await reply(interaction, `All right, <@${interaction.user.id}>`, [0, 1].includes(snitch));
    mod_alert_webhook(testing).send(`${interaction.user.username} asked Krystal to say ${whisper}`);
    () => [
        async () => {
            await followup(interaction, `${interaction.user.username} asked me to say \"${whisper}\"`, false);
            followup(interaction, 'Oh was that supposed to be a secret?', false);
        },
        async () => {
            if (!interaction.isCommand() || !interaction.channel) return;
            if (!whisper || typeof whisper != 'string') { reply(interaction, 'Something went wrong'); return; };
            await say(interaction.client, interaction.channel, whisper, 1000);
            say(ray, interaction.channel, `<@${interaction.user.id}> asked her to say that!`);
        },
        async () => { }
    ][snitch]();
}
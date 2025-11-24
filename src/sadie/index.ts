import { time, TimestampStyles, userMention } from "@discordjs/builders";
import { database, testing } from "..";
import { sadie } from "../clients";
import { ignore_message, randomchance } from "../common/functions";
import { ignore_channels, marinaId, marineId, testChannelId } from "../common/variables";
import { testCommands } from "./commandHandler";
import { addExclamationCommand } from "../common";
import { TextChannel } from "discord.js";

sadie.on('ready', async () => {
    await sadie.user?.setActivity('Who is Haru Urara?', { type: 'CUSTOM' });
    await sadie.user?.setStatus('online');
});

let notStepped: {[guildId: string]: number} = {};
let deployed: {[guildId: string]: number} = {};

sadie.on('messageCreate', async (msg) => {
    if (ignore_message(msg, sadie)) return;
    if (!testCommands(msg)) return;
    if (!notStepped[msg.guildId!]) notStepped[msg.guildId!] = 0;
    if (randomchance(5 + notStepped[msg.guildId!]/10)) {
        const minesDb = database.child('mines').child(msg.guildId!).child(msg.author.id);
        const mines = ((await minesDb.once('value')).val() || 0) + 1;
        minesDb.set(mines);
        msg.reply(`${userMention(msg.author.id)} stepped on a mine.\nThey have stepped on ${mines} mine${mines !== 1 ? 's' : ''} in total\n\n-# The chance of a mine appearing was ${(Math.floor((5 + notStepped[msg.guildId!]/10) * 100)/100).toFixed(2)}%`);
        deployed[msg.guildId!] = 0;
        notStepped[msg.guildId!] = 0;
    } else notStepped[msg.guildId!]++;
});

addExclamationCommand(['mines', 'mine'], async (msg, args) => {
    const channel = (await (await sadie.guilds.fetch(msg.guildId!)).channels.fetch(msg.channelId!))
    if (!(channel instanceof TextChannel)) {
        msg.reply('Something went wrong');
        return;
    }
    const messageSadie = await channel.messages.fetch(msg.id);
    const message = await messageSadie.reply('loading...');
    if (['odds', 'chance'].includes(args[1])) {
        if (msg.author.id === marineId && args[2]) {
            notStepped[msg.guildId!] = parseInt(args[2]);
        }
        message.edit(`The odds of a mine exploding are currently ${(Math.floor((5 + notStepped[msg.guildId!]/10) * 100)/100).toFixed(2)}%`);
        return;
    }
    if (['rank', 'ranks'].includes(args[1])) {
        const minesDb = database.child('mines').child(msg.guildId!);
        let mines = Object.entries(((await minesDb.once('value')).val() || {}) as {[id: string]: number});
        if (mines.length === 0) {
            message.edit(`No one has stepped on any mines on this server`);
        }
        mines.sort((a, b) => b[1] - a[1]);
        mines = mines.slice(0, 10);
        message.edit(`Mine ranking:\n\n${mines.map(([id, mine], i) => {
            let j = i;
            while (j > 0 && mines[j-1][1] === mine) j--;
            const pos = j + 1;
            return `${(pos).toString().padStart(2, '0')} - ${userMention(id)}: ${mine}`;
        }).join('\n')}`);
        return;
    }
    if (['total'].includes(args[1])) {
        const minesDb = database.child('mines').child(msg.guildId!);
        let mines = Object.values(((await minesDb.once('value')).val() || {}) as {[id: string]: number}).reduce((pv, cv) => cv + pv);
        message.edit(`${mines} mine${mines !== 1 ? 's' : ''} have been stepped on in total`);
        return;
    }
    if (['deploy'].includes(args[1])) {
        if (deployed[msg.guildId!] && deployed[msg.guildId!] + 60000 >= Date.now().valueOf()) {
            message.edit(`You will be able to deploy another mine ${time(new Date(deployed[msg.guildId!] + 60000), TimestampStyles.RelativeTime)}`);
            return;
        }
        if (!notStepped[msg.guildId!]) notStepped[msg.guildId!] = 0;
        notStepped[msg.guildId!] += 50;
        message.edit(`New mine deployed, explosion odds raised to ${(Math.floor((5 + notStepped[msg.guildId!]/10) * 100)/100).toFixed(2)}%`);
        deployed[msg.guildId!] = Date.now().valueOf();
        return;
    }
    const minesDb = database.child('mines').child(msg.guildId!).child(msg.author.id);
    const mines = ((await minesDb.once('value')).val() || 0);
    message.edit(`${userMention(msg.author.id)} has stepped on ${mines} mine${mines !== 1 ? 's' : ''} in total`);
})

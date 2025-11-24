import { database } from "..";
import { sieg } from "../clients";
import { ignore_message } from "../common/functions";
import { ignore_channels } from "../common/variables";

var strange_patterns: {[id: string]: string} = {};

(async () => { strange_patterns = (await database.child('strange_patterns').once('value')).val() || {} })();

sieg.on('messageCreate', (msg) => {
    if (!msg || !msg.member || !msg.author || msg.author.bot || msg.channel.isThread()) return;
    if (ignore_channels.includes(msg.channel.id)) return;
    const args = msg.content.split(' ');
    if (args[0] === '!dual') {
        let addend = 0;
        for (const arg of args) if (arg && !isNaN(parseInt(arg))) addend += parseInt(arg);
        const roll = () => Math.floor(Math.random() * 12) + 1;
        const hope = roll();
        const fear = roll();
        const message = [];
        const sum = hope + fear + addend;
        if (hope === fear) message.push(`# CRITICAL!!!`);
        else message.push(`### ${sum} with ${hope > fear ? 'HOPE' : 'FEAR'}!`);
        const pattern = strange_patterns[msg.author.id] || '0';
        if (fear.toString() === pattern || hope.toString() === pattern) {
            message.push(`### Strange patterns: ${pattern}`);
        }
        message.push(`-# Hope: ${hope}`);
        message.push(`-# Fear: ${fear}`);
        msg.reply(message.join('\n'))
    } else if (args[0] === '!strange') {
        strange_patterns[msg.author.id] = args[1];
        database.child('strange_patterns').child(msg.author.id).set(args[1]);
        msg.reply(`*Strange Patterns* set to ${args[1]}`);
    }
})
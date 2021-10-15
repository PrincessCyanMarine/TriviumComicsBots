import { MessageAttachment } from "discord.js";
import { database, testing } from "..";
import { d20, eli, krystal, ray } from "../clients";
import { generatecard, prestige } from "../d20/function";
import { killing } from "../krystal/functions";
import { say } from "./functions";
import { ignore_channels, testChannelId } from "./variables";


d20.on('messageCreate', async (msg) => {
    if (!msg || !msg.member || !msg.author || msg.author.bot) return;
    if (ignore_channels.includes(msg.channel.id)) return;
    if (testing && msg.channelId != testChannelId) return;
    else if (!testing && msg.channelId == testChannelId) return;
    let args = msg.content;
    let options = args.split(' ');
    if (args.startsWith('!')) {
        args = args.replace(/!/, '');
        switch (args.split(' ')[0]) {
            case 'card':
                msg.channel.sendTyping();
                msg.channel.send({ files: [await generatecard(msg)] });
                break;
            case 'prestige':
                prestige(msg);
                break;
            case 'c':
                say(d20, msg.channel, 'You can customize your card at https://cyanmarine.net/tc/card/customize');
                break;
            case 'profile':
                let target = msg.mentions.members?.first() ? msg.mentions.members?.first() : msg.member;
                const profile = [
                    () => { say(d20, msg.channel, 'You can customize your card at https://cyanmarine.net/tc/card/customize') },
                    () => { msg.channel.sendTyping(); generatecard(msg).then(card => { msg.channel.send({ files: [card] }) }); },
                    () => { say(krystal, msg.channel, `!profile <@${target?.id}>`); },
                    () => { killing(msg, target?.user, "normal", "Cyan asked me to kill whoever did that :GMKrystalDevious: :GMKrystalDevious:"); }
                ]
                profile[Math.floor(Math.random() * profile.length)]();
                break;
            case 'roll':
                if (!options[1]) { say(ray, msg.channel, 'Missing arguments!'); return; };
                let dice: number, ammount: number;
                if (options[1].includes('d')) {
                    dice = parseInt(options[1].split('d')[1]);
                    if (options[1].split('d')[0] == '')
                        ammount = 1;
                    else
                        ammount = parseInt(options[1].split('d')[0]);
                } else {
                    dice = parseInt(options[1]);
                    ammount = 1;
                }
                if (isNaN(dice) || isNaN(ammount) || dice < 0 || ammount < 0) { say(ray, msg.channel, 'Incorrect arguments!'); return; };
                if (ammount > 9999) { say(ray, msg.channel, 'Number too big!'); return; };


                let results: number[] = [];

                let i: number;
                for (i = 0; i < ammount; i++) results.push(Math.ceil(Math.random() * dice));

                if (ammount == 1 && dice == 20) { say(ray, msg.channel, { files: [new MessageAttachment(`./assets/ray/roll/${results[0]}.gif`, 'Roll.gif')] }); return; };

                let total = 0;
                results.forEach(roll => { total += roll; });

                let rolltext = ammount > 1 ? `${total.toString()}\n\`\`\`${results.join(', ')}\`\`\`` : total.toString();

                if (rolltext.length > 1000) rolltext = total.toString();

                say(ray, msg.channel, rolltext);

                break;
            case 'guild':
            case 'guilds':
                let guilds = ['Krystal', 'Sadie', 'Ray', 'Eli'];
                let guilds_compare = guilds.map(g => g.toLowerCase());
                let authorGuild = (await (await database.child(`guild/${msg.author.id}`).once('value')).val());
                if ((!options[1] && !authorGuild) || (options[1] && options[1].toLowerCase() == 'available')) { say(eli, msg.channel, `The available guilds are: ${guilds.join(', ')}!`); return; };

                if (!options[1] || (options[1] && options[1] == 'ranking')) {
                    let restext = '';
                    let ranking: { [guild: string]: number } = await (await database.child(`guilds/${msg.guildId}`).once('value')).val();
                    Object.entries(ranking).forEach(e => {
                        restext += `${e[0]}: ${e[1]}\n`;
                    });
                    say(eli, msg.channel, restext);
                    return;
                }

                if (guilds_compare.includes(options[1].toLowerCase())) {
                    database.child(`guild / ${msg.author.id}`).set(options[1].toLowerCase());
                    say(eli, msg.channel, `<@${msg.author.id}> joined ${options[1]} \'s guild!'`);
                    return;
                }

                break;
        };
    };
});
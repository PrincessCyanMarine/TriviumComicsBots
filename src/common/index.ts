import { GuildMember, Message, MessageActionRow, MessageAttachment, MessageButton, MessageSelectMenu, TextChannel } from "discord.js";
import { database, testing } from "..";
import { d20, eli, krystal, ray, sadie } from "../clients";
import { generatecard, get_rank_message, prestige } from "../d20/functions";
import { eating, killing } from "../krystal/functions";
import { random_from_array, say } from "./functions";
import { ignore_channels, marineId, testChannelId, testGuildId, triviumGuildId } from "./variables";
import { channelMention, memberNicknameMention } from "@discordjs/builders"
import { glitch, lamp, sleep } from "../attachments";
import { playrps, rps_bots, rps_bots_emojis } from "../games/rockpaperscissors";


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
                say(d20, msg.channel, {
                    content: 'You can customize your card here',
                    components: [
                        new MessageActionRow()
                            .addComponents([{
                                type: "BUTTON",
                                label: "Customize",
                                style: "LINK",
                                url: "https://cyanmarine.net/tc/card/customize"
                            }])
                    ]
                });
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
            case 'play':
            case 'play_button':
            case 'play_list':
                let bot_name;

                let list = options[0] == "!play_list" ? true : false;
                if (options[1] && rps_bots.includes(options[1].toLowerCase())) {
                    bot_name = options[1].toLowerCase();
                    playrps(bot_name, msg.author.id, msg.channel, list);
                    return;
                }

                let components: MessageActionRow[] = [];
                if (!list) {
                    rps_bots.forEach(bot => {
                        if (components.length == 0 || components[components.length - 1].components.length == 5)
                            components.push(new MessageActionRow());

                        components[components.length - 1]
                            .addComponents(
                                new MessageButton()
                                    .setCustomId(`play-against=${bot}&id=${msg.author.id}&list=0`)
                                    .setLabel(bot.toUpperCase())
                                    .setStyle("SECONDARY")
                                    .setEmoji(rps_bots_emojis[bot])
                            )
                    });
                } else {
                    components.push(new MessageActionRow()
                        .addComponents(
                            new MessageSelectMenu()
                                .addOptions(
                                    // { label, value, description, default, emoji}
                                    rps_bots.map(bot => ({
                                        label: bot.toUpperCase(),
                                        value: `play-against=${bot}&id=${msg.author.id}&list=1}`,
                                        description: bot == "random" ? `Play against a random character` : `Play against ${bot}`,
                                        emoji: rps_bots_emojis[bot]
                                    }))
                                )
                                .setCustomId("play-against-list")
                                .setPlaceholder("Choose")
                        )
                    )
                }

                msg.channel.send({
                    content: "Who do you want to play against?",
                    components: components
                });

                break;
            case 'rank':
                if (!msg.guild) return;
                let ray_channel = await ray.channels.fetch(msg.channel.id);
                if (!ray_channel?.isText()) return;
                ray_channel.sendTyping();
                say(ray, ray_channel, await get_rank_message(msg.guild, msg.author.id, await (await database.child('lvl/' + msg.guild.id).once('value')).val(), 0));
                break;
            case "summon":
                let summoned_creature = Math.floor(Math.random() * 20) + 1;
                if (msg.author.id == marineId && options[1] && !isNaN(parseInt(options[1]))) summoned_creature = parseInt(options[1]);
                await say(sadie, msg.channel, { content: "*You draw a magic circle on the ground…*", files: [new MessageAttachment(`./assets/ray/roll/${summoned_creature}.gif`, 'Roll.gif')] }, 500);
                if (summoned_creature == 1)
                    say(sadie, msg.channel, "A telephone appears! It starts ringing…\nYou answer the phone. \"We\'ve been trying to reach you about your vehicle’s extended warranty. Press one—\"\nYou hang up the phone.", 450);
                else if (summoned_creature <= 5)
                    say(sadie, msg.channel, "You fail!", 250);
                else if (summoned_creature <= 10)
                    say(sadie, msg.channel, "*Crickets.*", 250);
                else if (summoned_creature <= 15)
                    say(sadie, msg.channel, "Your cryptic chanting echoes unheard.", 250);
                else if (summoned_creature < 20)
                    say(sadie, msg.channel, "You summoned a literal dodo. Aren’t they extinct?", 300);
                else if (summoned_creature == 20)
                    random_from_array([
                        async () => { await say(sadie, msg.channel, "You step on a poisoned lego and die before seeing what you summoned!"); },
                        async () => { await say(sadie, msg.channel, "A wild Ray appears!"); },
                        async () => { await say(sadie, msg.channel, "A wild Krystal appears!"); await say(krystal, msg.channel, { content: "W̸̡̡̺̠̝̎̆ě̶̲́̒͒l̴̮̰̝͑́͛c̶̼̔́̿̆o̷̜̠̙̭͛͗̀͗ͅm̶̭͚̌e̵̤͕͗̒ ̸͉̺̻̔͐̉̂͐̉t̸̹͖̘̻̞́o̴̗̽͆ ̵̢̛͓̻̩̩̮̅t̴̬̯̲̍̏͗h̷̝̎͛é̷̯̤̤͗̑ ̷̡͉̙̱̲̿̓g̴͕͍͔̣̊́̀̾͝a̴̱̭͒͝m̷̢͕̜͗ȩ̶̹̈́̾̈͌ ̵̤̩̹̍͝o̷̺̎f̵̯̌͑̈́̚ ̸̡͓̞̯̩̃̏̿̚l̵̰̮̱̿́i̷͙̫̩͙̔́̀̄̕f̵̖͔̜́̾͋͘͝e̵͉͓̾̕͜!̵̛̥̓̀́͐̈́", files: [glitch] }, 250); },
                        async () => { await say(sadie, msg.channel, "A wild Sadie appears!\n\nWait that\'s me"); },
                        async () => { await say(sadie, msg.channel, "A wild Eli appears!"); },
                    ])();
                break;
        };
    };
});


krystal.on('guildMemberAdd', async (member) => {
    if (testing && member.guild.id != testGuildId) return;
    // console.log(`${member.user.username} joined ${member.guild.name}\nDefault channel: ${member.guild.systemChannelId}`);
    if (!member.guild.systemChannel) return;
    let channel = testing ? testChannelId : member.guild.systemChannel;
    await welcome_functions[Math.floor(Math.random() * welcome_functions.length)](member, channel);
    if (member.guild.id == triviumGuildId)
        await say(krystal, channel, `Get a free Role for reading the ${channelMention("611572782832287754")} channel!`);
});
const welcome_functions = [
    (member: GuildMember, channel: TextChannel | string): Promise<Message> => new Promise(async (resolve, reject) => {
        say(krystal, channel, `Welcome to the game of life, ${memberNicknameMention(member.id)}!`)
            .then(resolve).catch(reject);
    }),
    (member: GuildMember, channel: TextChannel | string): Promise<Message> => new Promise(async (resolve, reject) => {
        await say(krystal, channel, {
            content: `I would welcome you, ${memberNicknameMention(member.id)}, but I\'m currently a lamp and lamps do not talk.`,
            files: [lamp]
        }).then(resolve).catch(reject);
    }),
    (member: GuildMember, channel: TextChannel | string): Promise<Message> => new Promise(async (resolve, reject) => {
        say(krystal, channel, `Greetings, ${memberNicknameMention(member.id)}! \nRay told me to tell you that I'm his girlfriend, so don't try anything. \nThen Sadie told me to tell you to tell you that I'm not Ray's girlfriend. \nThen Eli told me they are both wrong and that I'm his girlfriend. \nThey're still arguing, so I still don't know who's girfriend I am.`)
            .then(resolve).catch(reject);
    }),
    (member: GuildMember, channel: TextChannel | string): Promise<Message> => new Promise(async (resolve, reject) => {
        say(krystal, channel, {
            content: `Welcome, ${memberNicknameMention(member.id)}!\nNow that you are properly greeted, I will return to the clothes pile.`,
            files: [sleep]
        }).then(resolve).catch(reject);
    }),
    (member: GuildMember, channel: TextChannel | string): Promise<Message> => new Promise(async (resolve, reject) => {
        say(krystal, channel, `Welcome, ${memberNicknameMention(member.id)}!\nIf I had what you call "emotions", I would be happy that you're here`)
            .then(resolve).catch(reject);
    }),
    (member: GuildMember, channel: TextChannel | string): Promise<Message> => new Promise(async (resolve, reject) => {
        say(krystal, channel, `Konnichiwa, ${memberNicknameMention(member.id)}-Chan (◕ᴗ◕✿)`)
            .then(resolve).catch(reject);
    }),
    (member: GuildMember, channel: TextChannel | string): Promise<Message> => new Promise(async (resolve, reject) => {
        say(krystal, channel, `For some reason the residence of this place keep on saying something like \"I would tell you to grab a chair, but we can\'t afford those\" when new people join. \nI don\'t really know what that means, but welcome anyways, ${memberNicknameMention(member.id)}.`)
            .then(resolve).catch(reject);
    }),
    (member: GuildMember, channel: TextChannel | string): Promise<Message> => new Promise(async (resolve, reject) => {
        say(krystal, channel, `Welcome, to what the residents of this place call \"Hell\", ${memberNicknameMention(member.id)}. Hope you like it in here`)
            .then(resolve).catch(reject);
    }),
    (member: GuildMember, channel: TextChannel | string): Promise<Message> => new Promise(async (resolve, reject) => {
        await say(ray, channel, `Hi, longshot133!`);
        await say(krystal, channel, `I think their name is ${memberNicknameMention(member.id)}`);
        say(ray, channel, `You just don't get jokes, do you?`)
            .then(resolve).catch(reject);
    }),
    (member: GuildMember, channel: TextChannel | string): Promise<Message> => new Promise(async (resolve, reject) => {
        say(krystal, channel, {
            content: `Welcome, ${member}. I heard that you humans like popcorn, so here is some.`,
            files: [await eating(undefined, member.user)]
        }).then(resolve).catch(reject);
    }),
];

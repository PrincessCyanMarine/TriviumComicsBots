import { Client, Interaction } from "discord.js";

const Discord = require('discord.js');
const krystal = new Discord.Client();
const sadie = new Discord.Client();
const ray = new Discord.Client();
const eli = new Discord.Client();
const d20 = new Discord.Client();
const cerby = new Discord.Client();

export function reply(client: Client, interaction: Interaction, message: string, exclusive: Boolean) {
    const data: {
        content: string;
        flags: number | undefined;
    } = {
        content: message,
        flags: undefined
    }

    if (exclusive) data["flags"] = 64;
    /*
        client.api.interactions(interaction.id, interaction.token).callback.post({
            data: {
                type: 4,
                data: data
            }
        });*/
}

// /**
//  * 
//  * @param {String | Discord.Client} bot 
//  * @param {Discord.TextChannel} channel 
//  * @param {Discord.Message} msg 
//  */

// function say(bot, channel_id, msg, callback) {
//     bots = {
//         "eli": eli,
//         "D20": d20,
//         "sadie": sadie,
//         "krystal": krystal,
//         "ray": ray
//     }

//     if (typeof bot == 'string')
//         if (bots[bot]) bot = bots[bot];
//         else return;

//     bot.channels.fetch(channel_id).then(ch => {
//         ch.startTyping();
//         setTimeout(() => {
//             ch.stopTyping();
//             ch.send(msg);
//         }, 1000);
//     });
//     if (callback) return callback();
//     return;
// }
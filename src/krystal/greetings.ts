import { Message } from "discord.js";
import { stare } from "../attachments";
import { krystal, sadie } from "../clients";
import { say } from "../common/functions";

export const greetings = [
    (msg: Message) => {
        say(krystal, msg.channel, `Konnichiwa, <@${msg.author.id}>-chan  (◕ᴗ◕✿)`);
    },
    (msg: Message) => {
        say(krystal, msg.channel, `I\'m sorry, <@${msg.author.id}>, Sadie-Sama told me not to talk to \"weebs\"`);
    },
    (msg: Message) => {
        say(krystal, msg.channel, "Hello! I am here!");
    },
    (msg: Message) => {
        say(krystal, msg.channel, "Thank you for acknowledging my existence!");
    },
    (msg: Message) => {
        say(krystal, msg.channel,
            `Greetings, <@${msg.author.id}>!\nRay told me to tell you that I'm his girlfriend, so don't try anything. \nThen Sadie told me to tell you that I'm not Ray's girlfriend. \nThen Eli told me they are both wrong and that I'm his girlfriend. They're still arguing, so I still don't know who's girfriend I am.`,
            2500);
    },
    (msg: Message) => {
        say(krystal, msg.channel, { files: [stare] });
    },
    (msg: Message) => {
        say(krystal, msg.channel, `Konnichiwa, <@${msg.author.id}>-chan  (◕ᴗ◕✿)`)
            .then(() => {
                say(sadie, msg.channel, 'Krystal, what did I say about talking to weebs?', 500)
                    .catch(console.error)
                    .then(() => {
                        say(krystal, msg.channel, `Sorry, <@${msg.author.id}>-Oniichan, Sadie said I am not allowed to talk to \"weebs\"`)
                            .catch(console.error);
                    })
                    .catch(console.error);
            })
            .catch(console.error);
    }
]
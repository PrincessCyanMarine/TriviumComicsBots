import { Message, MessageActionRow, MessageButton } from "discord.js";
import { addExclamationCommand } from "../common";
import { get_birds, say } from "../common/functions";
import { krystal } from "../clients";
import { database } from "..";

let call = async (msg: Message, options: string[]) => {
    // say(d20, msg.channel, "Currently unavailable");
    // return;
    let selected_bird = parseInt(options[1]) || -1;
    let bird_list = get_birds();
    if (selected_bird > -1 && selected_bird < bird_list.length) {
        let bird = bird_list[selected_bird];
        say(krystal, msg.channel, bird.bird + "\n" + bird.url);
        return;
    }
    let target = msg.mentions.members?.first() || msg.member;
    if (!target) {
        say(krystal, msg.channel, "No user found");
        return;
    }
    let birds = Object.entries((await database.child("birdpedia/" + msg.guild!.id + "/" + target.id).once("value")).val() || {});
    let percentage = Math.floor((birds.length / bird_list.length) * 100);
    say(krystal, msg.channel, {
        content: `${target.displayName} found ${birds.length} out of the birddex's ${bird_list.length} birds (${percentage})% full\n`,
        // components: [
        //     new MessageActionRow().addComponents(
        //         new MessageButton()
        //             .setStyle("LINK")
        //             .setLabel(`See ${target.displayName}'s birddex`)
        //             .setURL(`https://www.cyanmarine.net/tc/birddex?id=${target.id}&guild_id=${msg.guildId}`)
        //             .setEmoji("🐦")
        //     ),
        // ],
    });
};

addExclamationCommand(["bird", "birds", "birdpedia", "birddex", "birdex", "bp", "birdwiki"], call);

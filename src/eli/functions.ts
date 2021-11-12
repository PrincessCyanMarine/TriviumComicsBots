import { GuildMember, Message } from "discord.js";
import { eli, krystal, ray, sadie } from "../clients";
import { random_from_array, say } from "../common/functions";

export function dodoOnline(msg: Message) {
    const success = (dodo: GuildMember) => {
        // console.log(dodo.presence?.status);
        if (!dodo.presence || dodo.presence?.status == 'offline') { fail(); return; };
        random_from_array([
            () => { say(krystal, msg.channel, "Dodad is home! :GMKrystal:"); },
            () => { say(ray, msg.channel, "Oh no... :GMRayinternalscreaming:"); },
            () => { say(sadie, msg.channel, "Hey there, Dodo! :GMSadieExcited:"); },
            () => { say(krystal, msg.channel, "Okaerinasai, Dodo-sama") }
        ])();
    };

    const fail = () => { };

    msg.guild?.members.fetch('580178931559432212')
        .then(success)
        .catch(fail)
}
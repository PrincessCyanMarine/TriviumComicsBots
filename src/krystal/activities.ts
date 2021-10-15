import { ActivityType, Client } from "discord.js";
import { krystal } from "../clients";

export const krystal_activities = [
    () => { changeActivity(krystal, "PLAYING", "Dungeons & Dragons"); },
    () => { changeActivity(krystal, "PLAYING", "Sonic Adventure 1"); },
    () => { changeActivity(krystal, "PLAYING", "Sonic Adventure 2"); },
    () => { changeActivity(krystal, "WATCHING", "Sadie sleep"); },
    () => { changeActivity(krystal, "LISTENING", "Ray reading the weeb dictonary"); },
    () => { changeActivity(krystal, "PLAYING", "with a dragon"); },
    () => { changeActivity(krystal, "PLAYING", "Dress up as Sadie"); },
    () => { changeActivity(krystal, "WATCHING", "the world burn"); },
    () => { changeActivity(krystal, "PLAYING", "hide in a lamp"); },
    () => { changeActivity(krystal, "PLAYING", "Sonic Adventure 3"); },
    // () => { changeActivity(krystal, "PLAYING", ""); },
];



function changeActivity(bot: Client, type: ActivityType, text: string, avatar?: string | Buffer) {
    bot.user?.setActivity(text, { type: type, name: text });
    if (avatar) bot.user?.setAvatar(avatar);
};
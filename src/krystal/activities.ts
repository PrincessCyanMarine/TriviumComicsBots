import assets from "../assetsIndexes";
import { krystal } from "../clients";
import { changeActivity } from "../common/functions";

export const krystal_activities = [
    () => { changeActivity(krystal, "PLAYING", "Dungeons & Dragons", assets.krystal.avatars.dnd, 'dnd'); },
    () => { changeActivity(krystal, "PLAYING", "Sonic Adventure 1", assets.krystal.avatars.normal); },
    () => { changeActivity(krystal, "PLAYING", "Sonic Adventure 2", assets.krystal.avatars.normal); },
    () => { changeActivity(krystal, "WATCHING", "Sadie sleep", assets.krystal.avatars.sleep); },
    () => { changeActivity(krystal, "LISTENING", "Ray reading the weeb dictonary", assets.krystal.avatars.normal); },
    () => { changeActivity(krystal, "PLAYING", "with a dragon", assets.krystal.avatars.normal); },
    () => { changeActivity(krystal, "PLAYING", "Dress up as Sadie", assets.krystal.avatars.sadie); },
    () => { changeActivity(krystal, "WATCHING", "the world burn", assets.krystal.avatars.burn); },
    () => { changeActivity(krystal, "PLAYING", "hide in a lamp", assets.krystal.avatars.lamp); },
    () => { changeActivity(krystal, "PLAYING", "Sonic Adventure 3", assets.krystal.avatars.normal); }
];
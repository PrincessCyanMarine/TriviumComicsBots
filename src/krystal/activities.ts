import assets from "../assetsIndexes";
import { CustomActivity, krystal } from "../clients";
import { changeActivity } from "../common/functions";

export const krystal_activities: CustomActivity[] = [
    ["krystal", "PLAYING", "Dungeons & Dragons", assets.krystal.avatars.dnd, 'dnd'],
    ["krystal", "PLAYING", "Sonic Adventure 1", assets.krystal.avatars.normal],
    ["krystal", "PLAYING", "Sonic Adventure 2", assets.krystal.avatars.normal],
    ["krystal", "WATCHING", "Sadie sleep", assets.krystal.avatars.sleep],
    ["krystal", "LISTENING", "Ray reading the weeb dictonary", assets.krystal.avatars.normal],
    ["krystal", "PLAYING", "with a dragon", assets.krystal.avatars.normal, undefined, "Tutorial NPC"],
    ["krystal", "PLAYING", "Dress up as Sadie", assets.krystal.avatars.sadie, undefined, "Sadie"],
    ["krystal", "WATCHING", "the world burn", assets.krystal.avatars.burn],
    ["krystal", "PLAYING", "hide in a lamp", assets.krystal.avatars.lamp, undefined, "Lamp"],
    ["krystal", "PLAYING", "Sonic Adventure 3", assets.krystal.avatars.normal],
];
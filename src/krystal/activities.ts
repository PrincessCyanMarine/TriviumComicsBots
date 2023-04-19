import { ActivityType } from "discord.js";
import assets from "../assetsIndexes";
import { CustomActivity } from "../clients";

export const krystal_activities: CustomActivity[] = [
    ["krystal", ActivityType.Playing, "Dungeons & Dragons", assets.krystal.avatars.dnd, "dnd", undefined],
    ["krystal", ActivityType.Playing, "Sonic Adventure 1", assets.krystal.avatars.normal, undefined, undefined],
    ["krystal", ActivityType.Playing, "Sonic Adventure 2", assets.krystal.avatars.normal, undefined, undefined],
    ["krystal", ActivityType.Watching, "Sadie sleep", assets.krystal.avatars.sleep, undefined, undefined],
    ["krystal", ActivityType.Listening, "Ray reading the weeb dictonary", assets.krystal.avatars.normal, undefined, undefined],
    ["krystal", ActivityType.Playing, "with a dragon", assets.krystal.avatars.normal, undefined, "Tutorial NPC"],
    ["krystal", ActivityType.Playing, "Dress up as Sadie", assets.krystal.avatars.sadie, undefined, "Sadie"],
    ["krystal", ActivityType.Watching, "the world burn", assets.krystal.avatars.burn, undefined, undefined],
    ["krystal", ActivityType.Playing, "hide in a lamp", assets.krystal.avatars.lamp, undefined, "Lamp"],
    ["krystal", ActivityType.Playing, "Sonic Adventure 3", assets.krystal.avatars.normal, undefined, undefined],
    ["krystal", undefined, undefined, assets.crystal.avatar, "crystal", "Crystal"],
];

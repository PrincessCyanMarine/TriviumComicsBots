import { ActivityType } from "discord.js";
import assets from "../assetsIndexes";
import { CustomActivity } from "../clients";

export const sadie_activities: CustomActivity[] = [
    ["sadie", ActivityType.Playing, "Dungeons & Dragons", assets.sadie.avatars.normal, undefined, undefined],
    ["sadie", ActivityType.Playing, "Sonic Adventure 1", assets.sadie.avatars.normal, undefined, undefined],
    ["sadie", ActivityType.Playing, "Sonic Adventure 2", assets.sadie.avatars.normal, undefined, undefined],
    ["sadie", ActivityType.Playing, "Sonic Adventure 3", assets.sadie.avatars.normal, undefined, undefined],
    ["sadie", ActivityType.Playing, "Punch the unattractive weeb", assets.sadie.avatars.punch, undefined, undefined],
];

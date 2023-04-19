import { ActivityType } from "discord.js";
import assets from "../assetsIndexes";
import { CustomActivity } from "../clients";

export const ray_activities: CustomActivity[] = [
    ["ray", ActivityType.Playing, "Dungeons & Dragons", assets.ray.avatars.normal, undefined, "Ray"],
    ["ray", ActivityType.Playing, "Sonic Adventure 1", assets.ray.avatars.normal, undefined, "Ray"],
    ["ray", ActivityType.Playing, "Sonic Adventure 2", assets.ray.avatars.normal, undefined, "Ray"],
    ["ray", ActivityType.Playing, "Sonic Adventure 3", assets.ray.avatars.normal, undefined, "Ray"],
    ["ray", ActivityType.Watching, "anime", assets.ray.avatars.normal, undefined, "Weeb"],
    ["ray", ActivityType.Listening, "weeb music", assets.ray.avatars.normal, undefined, "Weeb"],
];

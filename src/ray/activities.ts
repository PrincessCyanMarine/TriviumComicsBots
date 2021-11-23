import assets from "../assetsIndexes";
import { CustomActivity, ray } from "../clients";
import { changeActivity } from "../common/functions";

export const ray_activities: CustomActivity[] = [
    ["ray", "PLAYING", "Dungeons & Dragons", assets.ray.avatars.normal, undefined, "Ray"],
    ["ray", "PLAYING", "Sonic Adventure 1", assets.ray.avatars.normal, undefined, "Ray"],
    ["ray", "PLAYING", "Sonic Adventure 2", assets.ray.avatars.normal, undefined, "Ray"],
    ["ray", "PLAYING", "Sonic Adventure 3", assets.ray.avatars.normal, undefined, "Ray"],
    ["ray", "WATCHING", "anime", assets.ray.avatars.normal, undefined, "Weeb"],
    ["ray", "LISTENING", "weeb music", assets.ray.avatars.normal, undefined, "Weeb"],
];
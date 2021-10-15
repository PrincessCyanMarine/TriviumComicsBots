import { ray } from "../clients";
import { changeActivity } from "../common/functions";

export const ray_activities = [
    () => { changeActivity(ray, "PLAYING", "Dungeons & Dragons"); },
    () => { changeActivity(ray, "PLAYING", "Sonic Adventure 1"); },
    () => { changeActivity(ray, "PLAYING", "Sonic Adventure 2"); },
    () => { changeActivity(ray, "PLAYING", "Sonic Adventure 3"); },
    () => { changeActivity(ray, "WATCHING", "anime"); },
    () => { changeActivity(ray, "LISTENING", "weeb music"); },
];
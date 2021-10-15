import { eli } from "../clients";
import { changeActivity } from "../common/functions";

export const eli_activities = [
    () => { changeActivity(eli, "PLAYING", "Dungeons & Dragons"); },
    () => { changeActivity(eli, "PLAYING", "Sonic Adventure 1"); },
    () => { changeActivity(eli, "PLAYING", "Sonic Adventure 2"); },
    () => { changeActivity(eli, "PLAYING", "Sonic Adventure 3"); },
    () => { changeActivity(eli, "WATCHING", "anime"); },
];
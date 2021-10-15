import { sadie } from "../clients";
import { changeActivity } from "../common/functions";

export const sadie_activities = [
    () => { changeActivity(sadie, "PLAYING", "Dungeons & Dragons"); },
    () => { changeActivity(sadie, "PLAYING", "Sonic Adventure 1"); },
    () => { changeActivity(sadie, "PLAYING", "Sonic Adventure 2"); },
    () => { changeActivity(sadie, "PLAYING", "Sonic Adventure 3"); },
    () => { changeActivity(sadie, "PLAYING", "Punch the unattractive weeb"); },
];
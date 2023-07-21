// IDs are already public

import { readFileSync } from "fs";
import { testing } from "..";

export const testGuildId: string = "620635349173010465";
export const triviumGuildId: string = "562429293364248587";
export var testChannelId: string = "892800588469911663";
export const setTestChannelId = (id: string) => (testChannelId = id);
// export const testChannelId: string = "999917475342843924";

export const sadieId: string = "622898538514350085";
export const krystalId: string = "620634675454541844";
export const RayId: string = "666795899879424020";
export const EliId: string = "666872683530813441";
export const CerbyId: string = "711241945149734914";
export const D20Id: string = "743606862578057277";
export const siegId: string = "723938416139567154";
export const botIds: string[] = [sadieId, krystalId, RayId, EliId, CerbyId, D20Id, siegId];

export const killWords: string[] = [
    "kill",
    "beat",
    "punch",
    "heal",
    "shoot",
    "attack",
    "unalive",
    "protect",
    "exterminate",
    "end.+?suffering",
    "silence",
];
export const protectedFromKills: string[] = [sadieId, krystalId, EliId, CerbyId];
export const not_count_in_channel_ids: string[] = [
    "728081841139220552",
    "725932268891406368",
    "745069948510142487",
    "624774782180917278",
    "690361467475984605",
];
export const ignore_channels: string[] = [
    "728081841139220552",
    "725932268891406368",
    "745069948510142487",
    "624774782180917278",
    "795927049670754304",
];
export const patreon_roles = [
    "795920588463800320",
    "715775653991153726",
    "795921622862659585",
    "795922644016824360",
    "795925053689692200",
    "795925478522617866",
];
// export const announcementChannelId: string = '674781280423903264'; // TestChannel
export const announcementChannelId: string = "613507549085302796"; // Announcement Channel
export const alert_role_id: string = "900363259188772865";
export const disturb_channels: string[] = ["892800588469911663", "562431692703531018", "620088019868844044"];

export const notificationChannel = "620635349173010474";

export const marineId = "305883924310261760";
export const dodoId = "297531251081084941";
export const marinaId = "334997744265723905";

export enum TIME {
    SECONDS = 1000,
    MINUTES = TIME.SECONDS * 60,
    HOURS = TIME.MINUTES * 60,
    DAYS = TIME.HOURS * 24,
    WEEKS = TIME.DAYS * 7,
    MONTHS = TIME.DAYS * 30,
    YEARS = TIME.DAYS * 365 + TIME.HOURS * 6,
}

export const command_list: { [character: string]: { [command_name: string]: string | boolean } } = JSON.parse(
    readFileSync("./commands.json", "utf-8")
);

export const roleplay_channels = () => {
    if (testing)
        return {
            input: "909151745605791804",
            output: "909152121037926420",
        };
    else
        return {
            input: "726171325856743525",
            output: "562431692703531018",
            // output: "725932268891406368",
        };
};

export const colors = [
    ["Cast Members", "Brown", "975071419476107354", "975077038862000220", ["579230527140134923"]],
    ["TC Characters", "Dark Grey", "975071748116598886", "DarkGrey:975077067223875634", ["716785870400651325"]],
    ["Queensblade", "Pink", "975068859780448286", "Pink:975077120491532318", ["609593848448155668"]],
    ["Celestial Hero", "Cyan", "975069308721987644", "Cyan:975077046537564160", ["795927049670754304"]],
    ["World Hero", "Yellow", "975069428024754307", "Yellow:975077129710612541", ["795925478522617866"]],
    ["National Hero", "Orange", "975069526762860564", "Orange:975077103718502540", ["795925053689692200"]],
    ["Home-State Hero", "Lime", "975069568550723644", "Lime:975077095501885540", ["795922644016824360"]],
    ["Home-Town Hero", "Grey", "975069615392694363", "Grey:975077076279369809", ["795921622862659585"]],
    ["Neighborhood Hero", "Peachy", "975069777724837958", "Peachy:975077112048414740", ["795920588463800320"]],
    ["Server Booster", "Light Pink", "975070932232208475", "LightPink:975077085007716352", ["715775653991153726"]],
    ["Gemini Twilight Fan", "Dark Pink", "975071133860769862", "DarkPink:975077054674513952", ["819361862474661890"]],
    ["Game Masters Fan", "Dark Blue", "975071215658102915", "DarkBlue:975077025654140988", ["774127564675481600"]],
] as [name: string, color: string, roleId: string, emoji: string, necessaryIds: string[]][];

export const queensbladeRoleId = "609593848448155668";
var restarting = false;

export const setRestarting = (value: boolean) => {
    restarting = value;
};

export const isRestarting = () => {
    return restarting;
};

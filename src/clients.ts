import { ActivityType, Client, CommandInteraction, Guild, GuildMember, Intents, ThreadChannel, User, WebhookClient } from "discord.js";
import { config } from "dotenv";
import {
    changeActivities,
    clearFilePath,
    commandTextConverter,
    random_from_array,
    readAllBotData,
    testExclamationCommand,
    testMessageCommand,
    wait,
} from "./common/functions";
import { killWords, marineId, protectedFromKills, triviumGuildId } from "./common/variables";
import { Message } from "discord.js";
import { database } from ".";
import { ActivatorType, BotDataTypes, BotNames, CommandType, VariableType, botNames } from "./model/botData";
import { existsSync, mkdirSync, writeFileSync } from "fs";
config();

const intents = [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_INTEGRATIONS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_PRESENCES,
    Intents.FLAGS.GUILD_MESSAGE_TYPING,
];

export var krystal = new Client({ intents }),
    sadie = new Client({ intents }),
    ray = new Client({ intents }),
    eli = new Client({ intents }),
    d20 = new Client({ intents }),
    cerby = new Client({ intents }),
    sieg = new Client({ intents }),
    odod = new Client({ intents });

krystal.login(process.env.BOT_KRYSTAL_TOKEN);
sadie.login(process.env.BOT_SADIE_TOKEN);
ray.login(process.env.BOT_RAY_TOKEN);
eli.login(process.env.BOT_ELI_TOKEN);
d20.login(process.env.BOT_D20_TOKEN);
cerby.login(process.env.BOT_CERBY_TOKEN);
sieg.login(process.env.BOT_SIEG_TOKEN);
odod.login(process.env.BOT_ODOD_TOKEN);

sieg.on("ready", () => {
    sieg.user?.setStatus("invisible");
});

const all_clients_ready = () => {
    for (let client of client_list) if (!client.isReady()) return false;
    return true;
};

export function isBotNameKey(key: string): key is BotNames {
    return botNames.includes(key as any);
}

export type BotTypeNameToType<T extends BotDataTypes> = T extends "activator"
    ? ActivatorType
    : T extends "command"
    ? CommandType<any>
    : T extends "variable"
    ? DataVariable<any>
    : any;

export class DataVariable<T = any> {
    public dataType = "variable";
    public description?: string;
    constructor(private variable: VariableType<T>) {
        this.description = variable.description;
        this.variable.value = this.variable.value || this.variable.defaultValue;
        if (this.variable.databaseKey && !this.variable.perGuild && !this.variable.perUser) {
            database.child(this.getPath()).on("value", (snap) => {
                let val = snap.val();
                if (val) this.variable.value = val;
            });
        }
    }

    private getPath(guild?: Guild | string | null, user?: User | GuildMember | string | null) {
        if (!this.variable.databaseKey) throw new Error(`No database key for variable ${this.variable.name} in bot ${this.variable.bot}`);
        let _path = "";
        if (this.variable.bot) _path += `${this.variable.bot}/`;
        _path += `${this.variable.databaseKey}/`;
        if (this.variable.perGuild) {
            if (!guild) throw new Error(`No guild for variable ${this.variable.name} in bot ${this.variable.bot}`);
            _path += `${typeof guild == "string" ? guild : guild.id}/`;
        }
        if (this.variable.perUser) {
            if (!user) throw new Error(`No user for variable ${this.variable.name} in bot ${this.variable.bot}`);
            _path += `${typeof user == "string" ? user : user.id}/`;
        }
        // console.log(this.variable, _path);
        return _path;
    }

    public async get(guild?: Guild | string | null, user?: User | GuildMember | string | null): Promise<T> {
        if (!this.variable.perGuild && !this.variable.perUser) return (this.variable.value || this.variable.defaultValue)! as T;
        let val = (await database.child(this.getPath(guild, user)).once("value")).val() || this.variable.value || this.variable.defaultValue;
        return val;
    }

    public async set(value: T, guild?: Guild | string | null, user?: User | GuildMember | string | null): Promise<T> {
        if (this.variable.databaseKey) await database.child(this.getPath(guild, user)).set(value);
        return (this.variable.value = value);
    }
}

export function setBotData(newBotData: typeof botData) {
    botData = newBotData;
}

export function getActivatorHelp(activator: ActivatorType, line_skip: string, detailed: boolean) {
    let url = `/commands/${clearFilePath(`${activator.bot}/${activator.name}.md`).replace(/%/g, "%25")}`;
    let _activator_text = `# [${activator.name} (${activator.bot})](${url})${line_skip}`;
    _activator_text += `${activator.description ? activator.description : "No description"}${line_skip}`;
    _activator_text += `Version: ${activator.version || "1.0.0"}${line_skip}`;
    _activator_text += `Priority: ${activator.priority || 0}${line_skip}`;
    // _activator_text += `Version: ${activator.version}\n`;
    _activator_text += `Activator type: ${activator.method}${line_skip}`;
    switch (activator.method) {
        case "slash":
            _activator_text += `Command: /${activator.activator}${line_skip}`;
            if (activator.args) {
                _activator_text += `${line_skip}## Options:${line_skip}`;
                for (let arg of activator.args) {
                    _activator_text += detailed
                        ? `### ${arg.name}${arg.required ? "*" : ""}${line_skip}`
                        : `- ${arg.name}${arg.required ? "*" : ""} (${arg.type})${line_skip}`;

                    if (detailed) {
                        _activator_text += `Type: ${arg.type}${line_skip}`;
                        if (arg.description) _activator_text += `${arg.description}${line_skip}`;
                        if ("min" in arg && (arg.min || arg.min == 0)) _activator_text += `Minimum: ${arg.min}${line_skip}`;
                        if ("max" in arg && (arg.max || arg.max == 0)) _activator_text += `Maximum: ${arg.max}${line_skip}`;
                        if ("choices" in arg && arg.choices && arg.choices.length > 0) {
                            _activator_text += `<details>${line_skip}<summary>Accepted values</summary> ${line_skip}`;
                            for (let choice of arg.choices) _activator_text += `- ${choice.name}\n`;
                            _activator_text += `${line_skip}</details>${line_skip}`;
                        }
                    }
                }
            }
            break;
        case "message":
            if ("match" in activator) {
                _activator_text += `Command: /${activator.match}/${line_skip}`;
            } else {
                _activator_text += `Command: ${activator.matchType || "any"} of\n- ${activator.matches
                    .map((s) => `/${s}/`)
                    .join("\n- ")}${line_skip}`;
                _activator_text += activator.botName ? `Must include bot name (${activator.bot})${line_skip}` : "";
            }
            break;
        case "exclamation":
            if ("activator" in activator) _activator_text += `Command: !${activator.activator}${line_skip}`;
            else _activator_text += `Command: ${activator.activators.map((s) => `!${s}`).join(", ")}${line_skip}`;
            break;
    }
    if (detailed) _activator_text += `link: [${url}](${url})${line_skip}`;
    else _activator_text += `${line_skip}For more information, see the [documentation](${url})`;
    return _activator_text;
}

export function makeCommandsMD() {
    let data: ActivatorType[] = [];
    let commands = [] as [ActivatorType, string][];
    for (let botName in botData) {
        let bot = botData[botName as BotNames];

        data = [...data, ...Object.values(bot.activator)];
    }
    data = data.filter((a) => !a.hideFromHelp).sort((a, b) => (b.priority || 0) - (a.priority || 0));
    // console.log(data);
    for (let command of data) {
        if (command.dataType == "activator") {
            let activator = command as ActivatorType;
            if (activator.hideFromHelp) continue;

            commands.push([activator, getActivatorHelp(activator, "\n\n", true)]);
        }
    }

    let text = `
# "Message commands" use regex

- /.*/ Matches anything
- /end.+?suffering/ "end (anything) suffering"
- /pf{2,}t/ "p", followed by 2 or more "f"s followed by "t" (for example "pfffffft", "pfft", "pffffffffffffffffffffffffffffffffffffffffft", etc)
- /(I|Im|I am)\s(will|going to|gonna|shall)\s(bed|sleep)/ "I am going to bed", "I'm gonna sleep", "I will bed", etc
- /(\S+?)s tip of the day/ A word followed by "tip of the day"\n\n\n\n\n\n\n`;
    if (commands.length > 0) text += `${commands.map((a) => a[1]).join("\n\n")}\n\n`;
    writeFileSync("commands.md", text);

    for (let [activator, text] of commands) {
        let dir = clearFilePath(`commands/${activator.bot}`);
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        writeFileSync(clearFilePath(`${dir}/${activator.name}.md`), text + `\n\n[All commands](/commands.md)`);
    }

    return "Commands written to commands.md";
}

export var botData: Record<
    BotNames,
    {
        [key in BotDataTypes]: {
            [name: string]: BotTypeNameToType<key>;
        };
    }
> = {
    d20: {
        activator: {
            "reload-data": {
                activator: "reload-data",
                method: "slash",
                type: "command",
                bot: "d20",
                description: "Writes commands to commands.md",
                hideFromHelp: true,
                command: {
                    type: "message",
                    command: {
                        type: "function",
                        function: async (moi) => {
                            if (!moi.user?.id || moi.user?.id != marineId) return "You can't do that";
                            require("./commands");
                            await readAllBotData();
                            return "Data reloaded";
                        },
                    },
                },
            },
        },
        command: {},
        variable: {},
    },
    cerberus: {
        activator: {},
        command: {},
        variable: {},
    },
    common: {
        activator: {},
        command: {},
        variable: {},
    },
    eli: {
        activator: {},
        command: {},
        variable: {},
    },
    krystal: {
        activator: {},
        command: {},
        variable: {},
    },
    ray: {
        activator: {},
        command: {},
        variable: {},
    },
    sadie: {
        activator: {},
        command: {},
        variable: {},
    },
    siegfried: {
        activator: {},
        command: {},
        variable: {},
    },
};

export var client_list = [krystal, sadie, ray, eli, cerby, sieg, d20];
client_list.forEach((client) => {
    client.on("ready", () => {
        // client.guilds.fetch(triviumGuildId).then(async (guild) => {
        //     let channels = await guild.channels.fetchActiveThreads();
        //     for (let channel of channels.threads.values()) {
        //         if (!channel?.isThread()) continue;
        //         await channel.join();
        //         let msg = await channel.fetchStarterMessage();
        //         msg?.react("🍒");
        //     }
        // });
        if (!client.user) throw "Something went wrong with client init";
        console.log(`${client.user.tag} is ready!!!`);
        changeActivities();
        if (all_clients_ready()) {
            console.log("All clients ready");
            require("./commands");
            readAllBotData().then(console.log);
        }
    });
    try {
        client.on("messageCreate", async (msg) => {
            let startTime = Date.now();
            testExclamationCommand(id2bot[client.user!.id!], msg, startTime);
            testMessageCommand(id2bot[client.user!.id!], msg, startTime);
            if (!msg.channel.isThread()) return;
            try {
                await warReact(msg);
                await wait(250);
            } catch (err) {
                console.log("Error in war reaction: Inner");
            }
        });
    } catch (err) {
        console.log("Error in war reaction: Outer");
    }
});

let warReact = (msg: Message) => {
    try {
        switch (msg.channel.id) {
            case "1103842715642384435":
                return msg.react("🍒");
            case "1115738435752308807":
                return msg.react("🖌️");
            case "1115836693971476481":
                return msg.react("🥭");

            case "1116005403533258804":
                return msg.react("🍓");
            case "1115748763726790776":
                return msg.react("🥚");
            default:
                try {
                    return msg.react(random_from_array(["🍒", "🖌️", "🥭", "🍓", "🥚"]));
                } catch (err) {
                    console.log("Error in war reaction: Default");
                }
        }
    } catch (err) {
        console.log("Error in war reaction: Switch");
    }
};

export const mod_alert_webhook = (testing: boolean) =>
    testing
        ? new WebhookClient({
              url: process.env.WEBHOOK_TESTING_CHANNEL || "",
          })
        : new WebhookClient({
              url: process.env.WEBHOOK_ALERT_CHANNEL || "",
          });

export const logwebhook = (testing: boolean) =>
    testing
        ? new WebhookClient({
              url: process.env.WEBHOOK_TESTING_CHANNEL || "",
          })
        : new WebhookClient({
              url: process.env.WEBHOOK_LOGGING_CHANNEL || "",
          });

export const clients: { [bot: string]: Client } = {
    d20: d20,
    sadie: sadie,
    krystal: krystal,
    eli: eli,
    ray: ray,
    cerberus: cerby,
    siegfried: sieg,
};

// IDs are already public
export const id2bot: { [bot: string]: BotNames } = {
    "743606862578057277": "d20",
    "622898538514350085": "sadie",
    "620634675454541844": "krystal",
    "666872683530813441": "eli",
    "666795899879424020": "ray",
    "711241945149734914": "cerberus",
    "723938416139567154": "siegfried",
};

export type CustomActivity = [string, Exclude<ActivityType, "CUSTOM"> | undefined, string | undefined, (string | Buffer)?, string?, string?];

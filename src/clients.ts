import { ActivityType, Client, Guild, GuildMember, Intents, ThreadChannel, User, WebhookClient } from "discord.js";
import { config } from "dotenv";
import { changeActivities, random_from_array, readAllBotData, testExclamationCommand, testMessageCommand, wait } from "./common/functions";
import { killWords, protectedFromKills, triviumGuildId } from "./common/variables";
import { Message } from "discord.js";
import { database } from ".";
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
    sieg = new Client({ intents });

krystal.login(process.env.BOT_KRYSTAL_TOKEN);
sadie.login(process.env.BOT_SADIE_TOKEN);
ray.login(process.env.BOT_RAY_TOKEN);
eli.login(process.env.BOT_ELI_TOKEN);
d20.login(process.env.BOT_D20_TOKEN);
cerby.login(process.env.BOT_CERBY_TOKEN);
sieg.login(process.env.BOT_SIEG_TOKEN);

sieg.on("ready", () => {
    sieg.user?.setStatus("invisible");
});

const all_clients_ready = () => {
    for (let client of client_list) if (!client.isReady()) return false;
    return true;
};

export const botDataTypes = ["activator", "command", "variable"] as const;
export type BotDataTypes = (typeof botDataTypes)[number];
export function isDataTypeKey(key: string): key is BotDataTypes {
    return botDataTypes.includes(key as any);
}
export const botNames = ["sadie", "common", "krystal", "ray", "eli", "cerberus", "siegfried", "d20"] as const;
export type BotNames = (typeof botNames)[number];

export type ImageType = {
    url?: string | string[];
    size?: {
        width: number;
        height: number;
    };
    composite?: ImageType[];
    position?: {
        x: number;
        y: number;
    };
    color?: string;
    actions?: (
        | {
              type: "crop";
              style: "out" | "in";
              x: number;
              y: number;
              width: number;
              height: number;
          }
        | {
              type: "rotate";
              angle: number;
          }
    )[];
} & (
    | {
          url: string | string[];
      }
    | {
          size: {
              width: number;
              height: number;
          };
          color: string;
      }
);

export type CommandCondition = { not?: boolean } & (
    | { value: CommandType }
    | { values: [CommandType, CommandType]; comparison: "includes" | "==" | ">" | "<" | ">=" | "<=" | "!=" }
);

export type CommandType<T = any, V extends any[] = any[]> = {
    dataType?: "command";
    name?: string;
    description?: string;
    version?: string;
    bot?: BotNames;
    args?: CommandType[];
    clearArgs?: boolean;
} & (
    | {
          type: "message";
          ephemeral?: boolean;
          text?: string;
          command?: CommandType;
          image?: ImageType;
          delay?: number;
      }
    | {
          type: "string";
          value: string;
      }
    | {
          type: "boolean";
          value: boolean;
      }
    | ({
          type: "array";
      } & (
          | {
                commandArray: CommandType[];
            }
          | { array: any[] }
      ))
    | {
          type: "sequence";
          commands: CommandType<T>[];
      }
    | {
          type: "command";
          command: {
              name: string;
              bot: BotNames;
          };
      }
    | {
          type: "random";
          commands: CommandType<T>[];
      }
    | {
          type: "random-weighted";
          commands: { command: CommandType<T>; weight: number }[];
      }
    | ({
          type: "conditional";
          ifTrue: CommandType<any>;
          ifFalse?: CommandType<any>;
      } & ({ condition: CommandCondition } | { conditions: CommandCondition[] }))
    | ({
          type: "get-variable";
      } & ({ variable: string; bot: BotNames } | { variable: VariableType<T> }))
    | ({
          type: "set-variable";
          newValue: CommandType<T>;
          bot?: BotNames;
      } & ({ variable: string; bot: BotNames } | { variable: VariableType<T> }))
    | {
          type: "function";
          function: string | ((...args: V) => T);
      }
);

export type ActivatorType = {
    dataType?: "activator";
    name?: string;
    description?: string;
    version?: string;
    guilds?: string[];
    bot: BotNames;
} & (
    | {
          method: "slash";
          activator: string;
          args?: any[];
      }
    | ({
          method: "message";
          botName?: boolean;
      } & ({ matches: string[]; matchType?: "any" | "all" } | { match: string }))
    | {
          method: "reaction";
          match: string;
      }
    | ({
          method: "exclamation";
      } & (
          | { activators: string[] }
          | {
                activator: string;
            }
      ))
) & {
        type: "command";
        command: CommandType<any>;
    };

export type VariableType<T = any> = {
    dataType?: "variable";
    name?: string;
    description?: string;
    version?: string;
    perGuild?: boolean;
    perUser?: boolean;
    // perChannel?: boolean;
    // perRole?: boolean;
    // perMessage?: boolean;
    // perActivator?: boolean;
    // perCommand?: boolean;
    databaseKey?: string;
    value?: T;
    defaultValue?: T;
    bot?: BotNames;
};

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

export function setBotData(newBotData: typeof botData) {
    botData = newBotData;
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
                command: {
                    type: "message",
                    command: {
                        type: "function",
                        function: async () => {
                            require("./commands");
                            await readAllBotData();
                            return "Data reloaded";
                        },
                    },
                },
            },
            help: {
                dataType: "activator",
                name: "help",
                method: "slash",
                activator: "help",
                description: "See a list of bot commands and their descriptions (only for commands using the new system)",
                bot: "d20",
                version: "1.0.0",
                type: "command",
                command: {
                    type: "message",
                    command: {
                        type: "function",
                        function: () => {
                            let text = "";
                            for (let botName in botData) {
                                let bot = botData[botName as BotNames];
                                text += `**${botName}**\n\n\`\`\`md\n`;
                                for (let dataType in bot) {
                                    let data = bot[dataType as BotDataTypes];
                                    let commands = [] as string[];
                                    let activators = [] as string[];
                                    let variables = [] as string[];
                                    for (let name in data) {
                                        let command = data[name as string];
                                        commands.push(`**${name}**\n${command.description || "No description"}`);
                                    }
                                    text += `# ${dataType}\n\n`;
                                    console.log(botName, "commands", commands, commands.length, commands.length > 0);
                                    console.log(botName, "activators", activators, activators.length, activators.length > 0);
                                    console.log(botName, "variables", variables, variables.length, variables.length > 0);
                                    if (commands.length > 0) text += `## Commands\n\n${commands.join("\n\n")}\n\n`;
                                    if (activators.length > 0) text += `## Activators\n\n${activators.join("\n\n")}\n\n`;
                                    if (variables.length > 0) text += `## Variables\n\n${variables.join("\n\n")}\n\n`;
                                }
                                text += "```";
                            }
                            return text;
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

export var client_list = [krystal, sadie, ray, eli, cerby, sieg];
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
            testExclamationCommand(id2bot[client.user!.id!], msg);
            testMessageCommand(id2bot[client.user!.id!], msg);
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

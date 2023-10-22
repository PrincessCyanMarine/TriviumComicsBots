export const botDataTypes = ["activator", "command", "variable"] as const;
export type BotDataTypes = (typeof botDataTypes)[number];
export function isDataTypeKey(key: string): key is BotDataTypes {
    return botDataTypes.includes(key as any);
}
export const botNames = ["sadie", "common", "krystal", "ray", "eli", "cerberus", "siegfried", "d20"] as const;
export type BotNames = (typeof botNames)[number];

export type ImageType = {
    url?: string | string[];
    name?: string;
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
    rootCommand?: {
        bot: BotNames | "NONE";
        name: string;
    };
} & (
    | {
          type: "message";
          ephemeral?: boolean;
          text?: string;
          command?: CommandType;
          image?: ImageType;
          delay?: number;
          messageSender?: string | string[];
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
    | {
          type: "percentage";
          percentage: number;
      }
);

export type ActivatorType = {
    dataType?: "activator";
    name?: string;
    description?: string;
    version?: string;
    guilds?: string[];
    bot: BotNames;
    priority?: number;
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
    databaseKey?: string;
    value?: T;
    defaultValue?: T;
    bot?: BotNames;
};

export type DataType = CommandType | ActivatorType | VariableType;

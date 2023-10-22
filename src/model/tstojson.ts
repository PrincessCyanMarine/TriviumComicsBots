import { parse, resolve } from "path";

// NEEDS TO REMOVE FUNCTION FROM {"TYPE": FUNCTION} IN ORDER TO WORK
import tsj, { Config, createGenerator } from "ts-json-schema-generator";

const fs = require("fs");

const tsconfig = resolve("./tsconfig.json");
const path = resolve("./src/model/botData.ts");
const output_path = resolve("./schema/botmeta.json");

// console.log({ tsconfig, path, output_path });

const config: Config = {
    path,
    tsconfig,
    type: "DataType", // Or <type-name> if you want to generate schema for that one type only
    // strictTuples: true,
    // additionalProperties: true,
    // sortProps: true,
};

const schema = createGenerator(config).createSchema(config.type);
const schemaString = JSON.stringify(schema);
if (!fs.existsSync(output_path)) fs.mkdirSync(parse(output_path).dir, { recursive: true });
fs.writeFileSync(output_path, schemaString);
// console.log(schemaString);

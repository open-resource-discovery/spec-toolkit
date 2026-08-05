import { readFileSync } from "node:fs";
import path from "node:path";
import { Ajv, type Schema } from "ajv";
import addFormats from "ajv-formats";
import { Command, Option } from "commander";
import fs from "fs-extra";
import * as yaml from "js-yaml";
import * as packageJson from "../package.json" with { type: "json" };
import { generate } from "./generate.js";
import type { SpecToolkitConfigurationDocument } from "./generated/spec-toolkit-config/spec-v1/types/index.js";
import registerPlugins from "./plugin/index.js";

interface CliOptions {
  config: string;
}

const DEFAULT_CONFIG_FILE_NAME = "./spec-toolkit.config.json";

/**
 * Executes the CLI with additional command line arguments (argv)
 */
function init(argv: string[]): void {
  const configFilePath = new Option(
    "-c, --config <configFilePath>",
    `path to spec-toolkit config file (default: ${DEFAULT_CONFIG_FILE_NAME})`,
  ).default(DEFAULT_CONFIG_FILE_NAME);

  const program = new Command();
  program
    .version(packageJson.default.version)
    .name("spec-toolkit")
    .usage("[options]")
    .description("Generates schema based interface documentation")
    .addOption(configFilePath)
    .action(run);

  program.parse(argv);
}

async function run(argv: CliOptions): Promise<void> {
  let configData: unknown;
  // Use path.resolve so an ABSOLUTE `-c` path is honored as-is; a relative path
  // still resolves against the current working directory (backward compatible).
  // Previously path.join(cwd, argv.config) mangled absolute paths.
  const configFilePath = path.resolve(process.cwd(), argv.config);

  try {
    if (configFilePath.endsWith(".json")) {
      const configFileContent = readFileSync(configFilePath, "utf-8");
      configData = JSON.parse(configFileContent);
    } else {
      throw new Error(`Unsupported file extension: ${configFilePath}. Should be ".json"`);
    }
  } catch (error) {
    process.stderr.write(`[error]: ${error}\n\n`);
    process.exit(1);
  }

  try {
    const configJsonSchema: Schema = yaml.load(
      fs.readFileSync(
        new URL("./generated/spec-toolkit-config/spec-v1/schemas/spec-toolkit-config.schema.json", import.meta.url),
        "utf-8",
      ),
    ) as Schema;

    const ajvInstance = new Ajv({ allErrors: true, allowUnionTypes: true, allowMatchingProperties: true });
    addFormats.default(ajvInstance);
    const validateSpecToolkitConfig = ajvInstance.compile<SpecToolkitConfigurationDocument>(configJsonSchema);
    if (validateSpecToolkitConfig(configData)) {
      const pluginManager = await registerPlugins(configData);

      await generate(configData, pluginManager);
    } else {
      throw new Error(
        `Validation of Config JSON Schema file "${configFilePath}" failed with errors:\n ${JSON.stringify(validateSpecToolkitConfig.errors, null, 2)}`,
      );
    }
  } catch (error) {
    process.stderr.write(`${["\x1b[91m", error, "\x1b[39m", "\n\n"].join("")}` /*`${error}\n\n`*/);
    process.exit(1);
  }
}

export { init };

import { readFileSync } from "node:fs";
import { Ajv, type Schema } from "ajv";
import addFormats from "ajv-formats";
import { Command, Option } from "commander";
import fs from "fs-extra";
import * as packageJson from "../package.json" with { type: "json" };
import { generate } from "./generate.js";
import type { SpecToolkitConfigurationDocument } from "./generated/spec-toolkit-config/spec-v1/types/index.js";
import { createGenerationContext, resolveConfiguredPath } from "./generationContext.js";
import registerPlugins from "./plugin/index.js";
import { loadYaml } from "./util/yaml.js";

export interface CliOptions {
  config: string;
}

const DEFAULT_CONFIG_FILE_NAME = "./spec-toolkit.config.json";

export function loadConfiguration(configFilePath: string): unknown {
  if (!configFilePath.endsWith(".json")) {
    throw new Error(`Unsupported file extension: ${configFilePath}. Should be ".json"`);
  }
  return JSON.parse(readFileSync(configFilePath, "utf-8"));
}

export function validateConfiguration(configData: unknown, configFilePath: string): SpecToolkitConfigurationDocument {
  const configJsonSchema = loadYaml(
    fs.readFileSync(
      new URL("./generated/spec-toolkit-config/spec-v1/schemas/spec-toolkit-config.schema.json", import.meta.url),
      "utf-8",
    ),
  ) as Schema;
  const ajvInstance = new Ajv({ allErrors: true, allowUnionTypes: true, allowMatchingProperties: true });
  addFormats.default(ajvInstance);
  const validateSpecToolkitConfig = ajvInstance.compile<SpecToolkitConfigurationDocument>(configJsonSchema);

  if (!validateSpecToolkitConfig(configData)) {
    throw new Error(
      `Validation of Config JSON Schema file "${configFilePath}" failed with errors:\n ${JSON.stringify(validateSpecToolkitConfig.errors, null, 2)}`,
    );
  }
  return configData;
}

export async function run(options: CliOptions, workingDirectory = process.cwd()): Promise<void> {
  const configFilePath = resolveConfiguredPath(options.config, workingDirectory);
  const configData = validateConfiguration(loadConfiguration(configFilePath), configFilePath);
  const context = createGenerationContext(configData, workingDirectory);
  const pluginManager = await registerPlugins(configData, context);
  await generate(configData, pluginManager, context);
}

/** Executes the CLI with additional command-line arguments. */
export async function init(argv: string[]): Promise<void> {
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
    .action(async () => run(program.opts<CliOptions>()));

  await program.parseAsync(argv);
}

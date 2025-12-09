/*
 **
 ** This is a wrapper that executes all the generators in one go.
 **
 * */
import { generateExampleDocumentation } from "./generateExampleDocumentation.js";
import { jsonSchemaToDocumentation } from "./generateInterfaceDocumentation.js";
import { generateTypeScriptDefinitions } from "./generateTypeScriptDefinitions.js";
import { log } from "./util/log.js";
import { mergeSpecExtensions } from "./mergeSpecExtensions.js";
import { SpecToolkitConfigurationDocument } from "./generated/spec-toolkit-config/spec-v1/types/index.js";
import PluginManager from "./plugin/pluginManager.js";
import SpecToolkitPlugin from "./plugin/specToolkitPlugin.js";

export const documentationOutputFolderName = "docs";
export const documentationExtensionsOutputFolderName = "docs/extensions";
export const documentationExamplesOutputFolderName = "docs/examples";
export const typesOutputFolderName = "types";
export const schemasOutputFolderName = "schemas";
export const extensionFolderDiffToOutputFolderName = `../`; // to get from "docs/extensions" to "docs" folder, step one folder path out

// global variable to hold the output path
let outputPath = "";
export function getOutputPath(): string {
  return outputPath;
}

export async function generate(
  configData: SpecToolkitConfigurationDocument,
  pluginManager: PluginManager,
): Promise<void> {
  outputPath = configData.outputPath;

  log.info(" ");
  log.info("==========================================================================");
  log.info("GENERATE Spec (GitHub) Page");
  log.info("==========================================================================");

  // Generate everything in order

  log.info(" ");
  log.info("--------------------------------------------------------------------------");
  log.info("GENERATE INTERFACE DOCUMENTATION (JSON-SCHEMA -> MD)");
  log.info("--------------------------------------------------------------------------");
  jsonSchemaToDocumentation(configData);

  log.info(" ");
  log.info("--------------------------------------------------------------------------");
  log.info("GENERATE AND MERGE SPEC EXTENSIONS");
  log.info("--------------------------------------------------------------------------");
  mergeSpecExtensions(configData);

  log.info(" ");
  log.info("--------------------------------------------------------------------------");
  log.info("GENERATE INTERFACE EXAMPLE PAGES");
  log.info("--------------------------------------------------------------------------");
  generateExampleDocumentation(configData);

  log.info(" ");
  log.info("--------------------------------------------------------------------------");
  log.info("GENERATE TypeScript Definitions");
  log.info("--------------------------------------------------------------------------");
  await generateTypeScriptDefinitions(configData);

  if (configData.plugins && configData.plugins.length > 0) {
    for (const plugin of configData.plugins) {
      log.info(" ");
      log.info("--------------------------------------------------------------------------");
      log.info(`RUN PLUGIN: ${plugin.packageName}`);
      log.info("--------------------------------------------------------------------------");

      log.info(`Generating documentation for plugin: ${plugin.packageName}`);
      const pluginInstance = pluginManager.loadPluginInstance<SpecToolkitPlugin>(plugin.packageName);
      if (pluginInstance && typeof pluginInstance.generate === "function") {
        const allMainSpecSourceFilePaths = [];
        for (const docConfig of configData.docsConfig) {
          if (docConfig.type === "spec") {
            allMainSpecSourceFilePaths.push(docConfig.sourceFilePath);
          }
        }
        // check if the plugin is developed locally in the "plugin" folder
        // the packageName will be in the format "./src/plugin/pluginName/index.js"
        // if so, extract the plugin name from the packageName
        const match = plugin.packageName.match(/\/plugin\/([^/]+)\//);
        const pluginName = match ? match[1] : plugin.packageName;

        await pluginInstance.generate(
          allMainSpecSourceFilePaths,
          configData.outputPath + `/plugin/${pluginName}`,
          plugin.options,
        );
      } else {
        log.warn(`No valid generate function found for plugin: ${plugin.packageName}`);
      }
    }
  }

  log.info(" ");
  log.info("==========================================================================");
  log.info("SUCCESS: Documentation successfully generated to", configData.outputPath);
  log.info("==========================================================================");
}

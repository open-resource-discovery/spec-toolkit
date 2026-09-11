/*
 **
 ** This is a wrapper that executes all the generators in one go.
 **
 * */

import type { SpecToolkitConfigurationDocument } from "./generated/spec-toolkit-config/spec-v1/types/index.js";
import { generateExampleDocumentation } from "./generateExampleDocumentation.js";
import { jsonSchemaToDocumentation } from "./generateInterfaceDocumentation.js";
import { generateTypeScriptDefinitions } from "./generateTypeScriptDefinitions.js";
import {
  createGenerationContext,
  documentationExamplesOutputFolderName,
  documentationExtensionsOutputFolderName,
  documentationOutputFolderName,
  extensionFolderDiffToOutputFolderName,
  type GenerationContext,
  schemasOutputFolderName,
  typesOutputFolderName,
} from "./generationContext.js";
import { mergeSpecExtensions } from "./mergeSpecExtensions.js";
import type PluginManager from "./plugin/pluginManager.js";
import type SpecToolkitPlugin from "./plugin/specToolkitPlugin.js";
import { log, logBanner, logSection } from "./util/log.js";

export {
  documentationExamplesOutputFolderName,
  documentationExtensionsOutputFolderName,
  documentationOutputFolderName,
  extensionFolderDiffToOutputFolderName,
  schemasOutputFolderName,
  typesOutputFolderName,
};

export async function generate(
  configData: SpecToolkitConfigurationDocument,
  pluginManager: PluginManager,
  context: GenerationContext = pluginManager.generationContext ?? createGenerationContext(configData),
): Promise<void> {
  logBanner("GENERATE Spec (GitHub) Page");

  logSection("GENERATE INTERFACE DOCUMENTATION (JSON-SCHEMA -> MD)");
  await jsonSchemaToDocumentation(configData, context);

  logSection("GENERATE AND MERGE SPEC EXTENSIONS");
  mergeSpecExtensions(configData, context);

  logSection("GENERATE INTERFACE EXAMPLE PAGES");
  generateExampleDocumentation(configData, context);

  logSection("GENERATE TYPESCRIPT DEFINITIONS");
  await generateTypeScriptDefinitions(configData, context);

  for (const plugin of configData.plugins ?? []) {
    logSection(`RUN PLUGIN: ${plugin.packageName}`);
    log.info(`Generating documentation for plugin: ${plugin.packageName}`);
    const pluginInstance = pluginManager.loadPluginInstance<SpecToolkitPlugin>(plugin.packageName);
    if (pluginInstance && typeof pluginInstance.generate === "function") {
      const sourceFilePaths = configData.docsConfig
        .filter((docConfig) => docConfig.type === "spec" || docConfig.type === "specExtension")
        .map((docConfig) => docConfig.sourceFilePath);
      const match = plugin.packageName.match(/\/plugin\/([^/]+)\//);
      const pluginName = match ? match[1] : plugin.packageName;

      // Keep plugin arguments in their configured form for compatibility with
      // third-party plugins that resolve paths against process.cwd().
      await pluginInstance.generate(sourceFilePaths, `${configData.outputPath}/plugin/${pluginName}`, plugin.options);
    } else {
      log.warn(`No valid generate function found for plugin: ${plugin.packageName}`);
    }
  }

  logBanner(`SUCCESS: Documentation successfully generated to ${configData.outputPath}`);
}

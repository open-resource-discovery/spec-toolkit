import type { SpecToolkitConfigurationDocument } from "../generated/spec-toolkit-config/spec-v1/types/index.js";
import { createGenerationContext, type GenerationContext } from "../generationContext.js";
import { log, logSection } from "../util/log.js";
import { registerExtensionKeyword } from "../util/validation.js";
import PluginManager from "./pluginManager.js";

export default async function registerPlugins(
  configData: SpecToolkitConfigurationDocument,
  context: GenerationContext = createGenerationContext(configData),
): Promise<PluginManager> {
  const pluginManager = new PluginManager(context);
  if (configData.plugins && configData.plugins.length > 0) {
    for (const plugin of configData.plugins) {
      logSection(`REGISTER PLUGIN: ${plugin.packageName}`);

      const pluginProperties = await pluginManager.registerPlugin({
        packageName: plugin.packageName,
      });

      // add plugin specific x- properties to the JSON Schema validator allowed keywords
      for (const xProperty of pluginProperties ?? []) {
        log.info(`Registering x- property ${xProperty} for plugin ${plugin.packageName}.`);
        registerExtensionKeyword(context.validation, xProperty);
      }

      // add plugin specific x- properties to the allowed list of x- properties which will be not filtered out from the output JSON Schema
      if (plugin.options?.preservedPluginSpecificXProperties) {
        for (const xProperty of plugin.options.preservedPluginSpecificXProperties) {
          log.info(
            `Adding x- property ${xProperty} for plugin ${plugin.packageName} to the allowed list of x- properties that are preserved in the output JSON Schema.`,
          );
          context.preservedPluginSpecificXProperties.add(xProperty);
        }
      }
    }
  }
  return pluginManager;
}

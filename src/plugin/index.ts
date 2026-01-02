import { SpecToolkitConfigurationDocument } from "../generated/spec-toolkit-config/spec-v1/types/index.js";
import { allowedListProperties } from "../util/jsonSchemaConversion.js";
import { log } from "../util/log.js";
import { preparedAjv } from "../util/validation.js";
import PluginManager from "./pluginManager.js";

export default async function registerPlugins(configData: SpecToolkitConfigurationDocument): Promise<PluginManager> {
  const pluginManager = new PluginManager();
  if (configData.plugins && configData.plugins.length > 0) {
    for (const plugin of configData.plugins) {
      log.info(" ");
      log.info("--------------------------------------------------------------------------");
      log.info(`REGISTER PLUGIN: ${plugin.packageName}`);
      log.info("--------------------------------------------------------------------------");

      const pluginProperties = await pluginManager.registerPlugin({
        packageName: plugin.packageName,
      });

      // add plugin specific x- properties to the JSON Schema validator allowed keywords
      for (const xProperty of pluginProperties ?? []) {
        log.info(`Registering x- property ${xProperty} for plugin ${plugin.packageName}.`);
        preparedAjv.addKeyword(xProperty);
      }

      // add plugin specific x- properties to the allowed list of x- properties which will be not filtered out from the output JSON Schema
      if (plugin.options?.preservedPluginSpecificXProperties) {
        for (const xProperty of plugin.options.preservedPluginSpecificXProperties) {
          log.info(
            `Adding x- property ${xProperty} for plugin ${plugin.packageName} to the allowed list of x- properties that are preserved in the output JSON Schema.`,
          );
          allowedListProperties.push(xProperty);
        }
      }
    }
  }
  return pluginManager;
}

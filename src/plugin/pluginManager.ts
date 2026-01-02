import { log } from "../util/log.js";
import { PluginConfigData } from "../generated/spec-toolkit-config/spec-v1/types/index.js";

type PluginInstance = {
  default: { prototype: { options: unknown } };
};
interface Plugin extends PluginConfigData {
  instance?: PluginInstance;
}

class PluginManager {
  private readonly pluginList: Map<string, Plugin>;

  public constructor() {
    this.pluginList = new Map();
  }

  public async registerPlugin(pluginConfigData: PluginConfigData): Promise<string[] | undefined> {
    if (!pluginConfigData.packageName) {
      throw new Error(`The plugin "packageName" is required for the plugin registration.`);
    }

    if (this.pluginExists(pluginConfigData.packageName)) {
      throw new Error(`Cannot re-register an already existing plugin "${pluginConfigData.packageName}".`);
    }

    try {
      let packageContents = undefined;

      // Check if the packageName is in the relative path of spec-toolkit code, local development of the plugin
      // packageName is in the form of ./src/plugin/<plugin-name>/index.js
      const matchLocalDevelopedPlugin = pluginConfigData.packageName.match(/.\/src\/plugin\/([^/]+)\//);
      if (matchLocalDevelopedPlugin) {
        packageContents = await import(`./${matchLocalDevelopedPlugin[1]}/index.js`);
      }

      // Check if the packageName is in the relative path of spec-toolkit code, local development of the plugin and the package is distributed
      // packageName is in the form of ./node_modules/@open-resource-discovery/spec-toolkit/dist/plugin/<plugin-name>/index.js
      const matchLocalDevelopedPluginFromDistFolder = pluginConfigData.packageName.match(
        /dist\/plugin\/([^/]+)\/index\.js$/,
      );
      if (matchLocalDevelopedPluginFromDistFolder) {
        packageContents = await import(`./${matchLocalDevelopedPluginFromDistFolder[1]}/index.js`);
      }

      // if the plugin is not locally developed in relative path to src folder or dist folder, try to import it as an npmjs package
      if (!packageContents) {
        // Try to import the plugin by npmjs package name
        packageContents = await import(pluginConfigData.packageName);
      }

      this.addPlugin(pluginConfigData, packageContents);

      const xProperties = packageContents.default?.prototype?.xProperties;
      if (xProperties && Array.isArray(xProperties)) {
        log.info(`Plugin ${pluginConfigData.packageName} has the following x- properties: ${xProperties.join(", ")}`);
        return xProperties;
      }
      log.info(`Plugin ${pluginConfigData.packageName} does not have any x- properties.`);
      return undefined;
    } catch (error) {
      log.error(`Cannot register "${pluginConfigData.packageName}" plugin because it could not be imported.`);
      throw error;
    }
  }

  public loadPluginInstance<T>(packageName: string): T {
    const plugin = this.pluginList.get(packageName);
    if (!plugin) {
      throw new Error(`Cannot find plugin ${packageName} in plugins registered list.`);
    }
    if (!plugin.instance) {
      throw new Error(`Plugin ${packageName} instance is not properly loaded.`);
    }

    plugin.instance.default.prototype.options = plugin.options;
    return Object.create(plugin?.instance.default.prototype) as T;
  }

  public listPluginList(): Map<string, Plugin> {
    return this.pluginList;
  }

  private pluginExists(packageName: string): boolean {
    return this.pluginList.has(packageName);
  }

  private addPlugin(plugin: Plugin, packageContents: unknown): void {
    if (!Object.prototype.hasOwnProperty.call(packageContents, "default")) {
      throw new Error(`Plugin ${plugin.packageName} does not have a default export.`);
    }

    this.pluginList.set(plugin.packageName, {
      ...plugin,
      instance: packageContents as PluginInstance,
    });
    log.info(`Plugin ${plugin.packageName} successfully registered.`);
  }
}

export default PluginManager;

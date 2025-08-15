import { PluginConfigData } from "../generated/spec-toolkit-config/spec-v1/types/index.js";
import PluginManager from "./pluginManager.js";

describe("PluginManager Tests", () => {
  test("should throw an error if no 'packageName' was provided in the registration", async () => {
    const pluginManager = new PluginManager();
    const plugin = {};
    await expect(pluginManager.registerPlugin(plugin as PluginConfigData)).rejects.toThrow(
      `The plugin "packageName" is required for the plugin registration.`,
    );
  });

  test("should throw an error if the plugin cannot be imported", async () => {
    const pluginManager = new PluginManager();
    const plugin1: PluginConfigData = {
      packageName: "./src/plugin/pathDoesNotExist/index.js",
      options: { option1: "value1" },
    };
    const plugin2: PluginConfigData = {
      packageName: "doesNotExist",
      options: { option1: "value1" },
    };
    try {
      await pluginManager.registerPlugin(plugin1);
    } catch (error) {
      // error: '\x1b[31m\x1b[1mConfiguration error\x1b[22m:\x1b[39m\x1b[31m\x1b[39m\x1b[31mCould not locate module \x1b[1m./pathDoesNotExist/index.js\x1b[22m mapped as:\x1b[39m
      expect((error as Error).message).toContain("Could not locate module");
      expect((error as Error).message).toContain("./pathDoesNotExist/index.js");
    }
    try {
      await pluginManager.registerPlugin(plugin2);
    } catch (error) {
      expect((error as Error).message).toContain("Cannot find module 'doesNotExist' from 'src/plugin/pluginManager.ts");
    }
  });

  test("should throw an error if an already registered plugin is re-registered", async () => {
    const pluginManager = new PluginManager();
    const plugin: PluginConfigData = {
      packageName: "./src/plugin/ums/index.js",
    };
    await pluginManager.registerPlugin(plugin);
    await expect(pluginManager.registerPlugin(plugin)).rejects.toThrow(
      `Cannot re-register an already existing plugin "./src/plugin/ums/index.js".`,
    );
  });
});

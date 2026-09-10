import type { SpecToolkitConfigurationDocument } from "../generated/spec-toolkit-config/spec-v1/types/index.js";
import { createGenerationContext } from "../generationContext.js";
import { afterEach, describe, expect, it, mock } from "../testHelpers/nodeTest.js";
import registerPlugins from "./index.js";
import PluginManager from "./pluginManager.js";

describe("registerPlugins tests", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("registers plugin-specific x- properties in the run context", async () => {
    const registerSpy = mock
      .spyOn(PluginManager.prototype, "registerPlugin")
      .mockResolvedValue(["x-plugin1-foo-property", "x-plugin1-bar-property"]);
    const config: SpecToolkitConfigurationDocument = {
      plugins: [{ packageName: "plugin1" }],
      outputPath: "out",
      docsConfig: [{ type: "spec", id: "test-id", sourceFilePath: "test-file.yaml" }],
    };
    const context = createGenerationContext(config);
    const addKeywordSpy = mock.spyOn(context.validation.ajv, "addKeyword");

    const pm = await registerPlugins(config, context);

    expect(pm).toBeInstanceOf(PluginManager);
    expect(registerSpy).toHaveBeenCalledWith({ packageName: "plugin1" });
    expect(addKeywordSpy).toHaveBeenCalledWith("x-plugin1-foo-property");
    expect(addKeywordSpy).toHaveBeenCalledWith("x-plugin1-bar-property");
  });

  it("isolates preserved plugin properties between run contexts", async () => {
    mock.spyOn(PluginManager.prototype, "registerPlugin").mockResolvedValue([]);
    const config: SpecToolkitConfigurationDocument = {
      plugins: [
        { packageName: "plugin1", options: { preservedPluginSpecificXProperties: ["x-plugin1-foo-property"] } },
      ],
      outputPath: "out",
      docsConfig: [{ type: "spec", id: "test-id", sourceFilePath: "test-file.yaml" }],
    };

    const context = createGenerationContext(config);
    const unrelatedContext = createGenerationContext(config);

    await registerPlugins(config, context);

    expect(context.preservedPluginSpecificXProperties.has("x-plugin1-foo-property")).toBe(true);
    expect(context.preservedPluginSpecificXProperties.has("x-plugin1-bar-property")).toBe(false);
    expect(unrelatedContext.preservedPluginSpecificXProperties.has("x-plugin1-foo-property")).toBe(false);
  });

  it("does nothing when no plugins are present in the configuration", async () => {
    const registerSpy = mock.spyOn(PluginManager.prototype, "registerPlugin");

    const config: SpecToolkitConfigurationDocument = {
      plugins: [
        // empty plugins array
      ],
      outputPath: "out",
      docsConfig: [{ type: "spec", id: "test-id", sourceFilePath: "test-file.yaml" }],
    };
    const context = createGenerationContext(config);
    const addKeywordSpy = mock.spyOn(context.validation.ajv, "addKeyword");
    const pm = await registerPlugins(config, context);

    expect(pm).toBeInstanceOf(PluginManager);
    expect(registerSpy).not.toHaveBeenCalled();
    expect(addKeywordSpy).not.toHaveBeenCalled();
  });

  it("allows the same plugin configuration in consecutive runs", async () => {
    const config: SpecToolkitConfigurationDocument = {
      plugins: [{ packageName: "./src/plugin/ums/index.js" }],
      outputPath: "out",
      docsConfig: [{ type: "spec", id: "test-id", sourceFilePath: "test-file.yaml" }],
    };

    await registerPlugins(config);
    await registerPlugins(config);
  });
});

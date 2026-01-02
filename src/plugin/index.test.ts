import { jest } from "@jest/globals";
import registerPlugins from "./index.js";
import PluginManager from "./pluginManager.js";
import { preparedAjv } from "../util/validation.js";
import { allowedListProperties } from "../util/jsonSchemaConversion.js";
import type { SpecToolkitConfigurationDocument } from "../generated/spec-toolkit-config/spec-v1/types/index.js";

describe("registerPlugins tests", () => {
  const initialAllowed = [...allowedListProperties];

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("registers plugin with its specific plugin x- properties to the preparedAjv", async () => {
    const registerSpy = jest
      .spyOn(PluginManager.prototype, "registerPlugin")
      .mockResolvedValue(["x-plugin1-foo-property", "x-plugin1-bar-property"]);
    const addKeywordSpy = jest.spyOn(preparedAjv, "addKeyword");

    const config: SpecToolkitConfigurationDocument = {
      plugins: [{ packageName: "plugin1" }],
      outputPath: "out",
      docsConfig: [{ type: "spec", id: "test-id", sourceFilePath: "test-file.yaml" }],
    };

    const pm = await registerPlugins(config);

    expect(pm).toBeInstanceOf(PluginManager);
    expect(registerSpy).toHaveBeenCalledWith({ packageName: "plugin1" });
    expect(addKeywordSpy).toHaveBeenCalledWith("x-plugin1-foo-property");
    expect(addKeywordSpy).toHaveBeenCalledWith("x-plugin1-bar-property");
  });

  it("adds preservedPluginSpecificXProperties to the preparedAjv allowedListProperties", async () => {
    const config: SpecToolkitConfigurationDocument = {
      plugins: [
        { packageName: "plugin1", options: { preservedPluginSpecificXProperties: ["x-plugin1-foo-property"] } },
      ],
      outputPath: "out",
      docsConfig: [{ type: "spec", id: "test-id", sourceFilePath: "test-file.yaml" }],
    };

    expect(allowedListProperties).not.toContain("x-plugin1-foo-property");
    expect(allowedListProperties).not.toContain("x-plugin1-bar-property");

    await registerPlugins(config);

    expect(allowedListProperties).toContain("x-plugin1-foo-property");
    expect(allowedListProperties).not.toContain("x-plugin1-bar-property");

    // restore allowed list to initial state
    allowedListProperties.length = 0;
    allowedListProperties.push(...initialAllowed);
  });

  it("does nothing when no plugins are present in the configuration", async () => {
    const registerSpy = jest.spyOn(PluginManager.prototype, "registerPlugin");
    const addKeywordSpy = jest.spyOn(preparedAjv, "addKeyword");

    const config: SpecToolkitConfigurationDocument = {
      plugins: [
        // empty plugins array
      ],
      outputPath: "out",
      docsConfig: [{ type: "spec", id: "test-id", sourceFilePath: "test-file.yaml" }],
    };
    const pm = await registerPlugins(config);

    expect(pm).toBeInstanceOf(PluginManager);
    expect(registerSpy).not.toHaveBeenCalled();
    expect(addKeywordSpy).not.toHaveBeenCalled();
  });
});

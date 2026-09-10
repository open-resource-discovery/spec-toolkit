import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { loadConfiguration, validateConfiguration } from "./cliRunner.js";
import { afterEach, describe, expect, test } from "./testHelpers/nodeTest.js";

describe("CLI configuration", () => {
  const testDirectories: string[] = [];

  afterEach(() => {
    for (const testDirectory of testDirectories.splice(0)) {
      fs.removeSync(testDirectory);
    }
  });

  test("loads JSON configuration files", () => {
    const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "spec-toolkit-config-"));
    testDirectories.push(testDirectory);
    const configFilePath = path.join(testDirectory, "spec-toolkit.json");
    fs.writeFileSync(configFilePath, JSON.stringify({ outputPath: "generated" }));

    expect(loadConfiguration(configFilePath)).toEqual({ outputPath: "generated" });
  });

  test("rejects unsupported configuration file extensions", () => {
    expect(() => loadConfiguration("spec-toolkit.yaml")).toThrow(
      'Unsupported file extension: spec-toolkit.yaml. Should be ".json"',
    );
  });

  test("returns a validated configuration", () => {
    const config = {
      outputPath: "generated",
      docsConfig: [{ type: "spec", id: "example", sourceFilePath: "example.yaml" }],
    };

    expect(validateConfiguration(config, "spec-toolkit.json")).toBe(config);
  });

  test("reports all configuration validation errors", () => {
    expect(() => validateConfiguration({ docsConfig: [] }, "spec-toolkit.json")).toThrow(
      "must have required property 'outputPath'",
    );
  });
});

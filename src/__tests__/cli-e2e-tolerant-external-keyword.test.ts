import path from "node:path";
import spawnAsync from "@expo/spawn-async";
import fs from "fs-extra";
import type { SpecToolkitConfigurationDocument } from "../generated/spec-toolkit-config/spec-v1/types/spec-toolkit-config.js";
import { afterAll, beforeAll, describe, expect, test } from "../testHelpers/nodeTest.js";

describe("CLI e2e: tolerant bundled extension keywords", () => {
  const cliScriptPath = "./dist/cli.js";
  const testDataName = "tmpTestData-cli-e2e-tolerant-external-keyword";
  const testOutputName = "tmpTestOutput-cli-e2e-tolerant-external-keyword";
  const testData = path.join(process.cwd(), "src", "__tests__", testDataName);
  const testOutput = path.join(process.cwd(), "src", "__tests__", testOutputName);

  beforeAll(() => {
    fs.ensureDirSync(testData);
    fs.ensureDirSync(testOutput);
    fs.writeJsonSync(path.join(testData, "external.schema.json"), {
      definitions: {
        External: {
          title: "External",
          type: "object",
          "x-introduced-in-version": "1.0.0",
          "x-ums-type": "custom",
          examples: [{ value: "example" }],
          properties: {
            value: { type: "string", examples: ["example"] },
          },
        },
      },
    });
    fs.writeJsonSync(path.join(testData, "root.schema.json"), {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: "Root",
      type: "object",
      properties: { imported: { $ref: "#/definitions/Imported" } },
      definitions: {
        Imported: { $ref: "./external.schema.json#/definitions/External" },
      },
    });
  });

  afterAll(() => {
    fs.removeSync(testOutput);
    fs.removeSync(testData);
  });

  test("generates from a bundled schema containing an unregistered extension keyword", async () => {
    const config: SpecToolkitConfigurationDocument = {
      outputPath: `src/__tests__/${testOutputName}`,
      generalConfig: { schemaMode: "tolerant" },
      docsConfig: [
        {
          type: "spec",
          id: "root",
          sourceFilePath: `./src/__tests__/${testDataName}/root.schema.json`,
        },
      ],
    };
    const configPath = path.join(testData, "config.json");
    fs.writeJsonSync(configPath, config);

    const { stdout, stderr } = await spawnAsync("node", [cliScriptPath, "-c", configPath]);

    expect(stdout).toContain(`SUCCESS: Documentation successfully generated to src/__tests__/${testOutputName}`);
    expect(stderr).toEqual("");
    const outputSchema = fs.readJsonSync(path.join(testOutput, "schemas", "root.schema.json"));
    expect(outputSchema.definitions).toBeDefined();
  });

  test("keeps unregistered extension keywords invalid in strict mode", async () => {
    const config: SpecToolkitConfigurationDocument = {
      outputPath: `src/__tests__/${testOutputName}`,
      docsConfig: [
        {
          type: "spec",
          id: "root",
          sourceFilePath: `./src/__tests__/${testDataName}/root.schema.json`,
        },
      ],
    };
    const configPath = path.join(testData, "strict-config.json");
    fs.writeJsonSync(configPath, config);

    await expect(spawnAsync("node", [cliScriptPath, "-c", configPath])).rejects.toMatchObject({
      stderr: expect.stringContaining("x-ums-type"),
    });
  });
});

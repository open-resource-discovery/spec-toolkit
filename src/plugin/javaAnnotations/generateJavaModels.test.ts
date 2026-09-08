import path from "node:path";
import fs from "fs-extra";
import * as yaml from "js-yaml";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, mock } from "../../testHelpers/nodeTest.js";
import { log } from "../../util/log.js";
import type { JavaAnnotationsConfig } from "./configModel.js";
import { generateModels } from "./generateJavaModels.js";

describe("generateModels", () => {
  const pluginDir = path.join(process.cwd(), "src", "plugin", "javaAnnotations");
  const testDir = path.join(pluginDir, "testData");
  const outputDir = path.join(pluginDir, "tmpOutput");
  let errorSpy: ReturnType<typeof mock.spyOn>;

  beforeAll(() => {
    // Create test directory and write a valid JSON schema for Person
    fs.ensureDirSync(testDir);
    const schema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: "Person",
      type: "object",
      properties: {
        firstName: { type: "string" },
        lastName: { type: "string" },
      },
      required: ["firstName", "lastName"],
    };
    const schemaPath = path.join(testDir, "person.schema.yaml");
    fs.writeFileSync(schemaPath, yaml.dump(schema), "utf8");
  });

  beforeEach(() => {
    errorSpy = mock.spyOn(log, "error").mockReturnValue(undefined);
    mock.spyOn(log, "debug").mockReturnValue(undefined);
    fs.removeSync(outputDir);
  });

  afterEach(() => {
    // Restore all mocks after each test
    mock.restoreAll();
  });

  afterAll(() => {
    fs.removeSync(testDir);
    fs.removeSync(outputDir);
  });

  it("generates Java files without errors and matches the snapshot", async () => {
    const config: JavaAnnotationsConfig = {
      packageAnnotations: "com.example.annotations",
      modelPackage: "com.example.model",
    };

    await generateModels(config, path.join(testDir, "person.schema.yaml"), outputDir);

    const modelDir = path.join(outputDir, ...config.modelPackage.split("."));
    expect(fs.existsSync(modelDir)).toBe(true);

    const files = fs.readdirSync(modelDir).filter((f) => f.endsWith(".java"));
    expect(files.length).toBeGreaterThan(0);
    expect(files).toContain("PersonSchema.java");

    const generated: Record<string, string> = {};
    for (const file of files) {
      generated[file] = fs.readFileSync(path.join(modelDir, file), "utf8");
    }

    expect(generated).toMatchSnapshot();
  });

  it("logs an error when the schema file does not exist", async () => {
    const missingPath = path.join(testDir, "does_not_exist.yaml");
    const config: JavaAnnotationsConfig = {
      packageAnnotations: "com.example.annotations",
      modelPackage: "com.example.model",
    };

    await generateModels(config, missingPath, outputDir);

    expect(errorSpy).toHaveBeenCalledWith(`Schema file not found: ${missingPath}`);
  });

  it("logs an error for invalid YAML/JSON in the schema", async () => {
    const badPath = path.join(testDir, "invalid.schema.yaml");
    fs.writeFileSync(badPath, "not: valid: yaml::: }", "utf8");
    const config: JavaAnnotationsConfig = {
      packageAnnotations: "com.example.annotations",
      modelPackage: "com.example.model",
    };

    await generateModels(config, badPath, outputDir);

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining(`Failed to parse schema (${badPath}):`));
  });

  it("logs an error when modelPackage is missing", async () => {
    const config = {
      packageAnnotations: "com.example.annotations",
      modelPackage: "",
    } as unknown as JavaAnnotationsConfig;

    await generateModels(config, path.join(testDir, "person.schema.yaml"), outputDir);

    expect(errorSpy).toHaveBeenCalledWith("Required option `modelPackage` is missing");
  });

  it("logs an error when quicktype generation fails", async () => {
    // Feed a schema with an unresolvable $ref so the real quicktype throws,
    // exercising the catch block in generateModels.
    const badSchemaPath = path.join(testDir, "brokenRef.schema.yaml");
    fs.writeFileSync(
      badSchemaPath,
      yaml.dump({ type: "object", properties: { a: { $ref: "#/definitions/DoesNotExist" } } }),
      "utf8",
    );
    const config: JavaAnnotationsConfig = {
      packageAnnotations: "com.example.annotations",
      modelPackage: "com.example.model",
    };

    await generateModels(config, badSchemaPath, outputDir);

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("quicktype generation failed:"));
  });
});

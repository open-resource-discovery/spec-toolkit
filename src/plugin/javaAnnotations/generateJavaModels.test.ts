import { jest } from "@jest/globals";
import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";
import { log } from "../../util/log.js";
import type { JavaAnnotationsConfig } from "./configModel.js";
import { generateModels } from "./generateJavaModels.js";

describe("generateModels", () => {
  const pluginDir = path.join(process.cwd(), "src", "plugin", "javaAnnotations");
  const testDir = path.join(pluginDir, "testData");
  const outputDir = path.join(pluginDir, "tmpOutput");
  let errorSpy: ReturnType<typeof jest.spyOn>;

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
    errorSpy = jest.spyOn(log, "error").mockReturnValue(undefined);
    jest.spyOn(log, "debug").mockReturnValue(undefined);
    fs.removeSync(outputDir);
  });

  afterEach(() => {
    // Restore all mocks after each test
    jest.restoreAllMocks();
  });

  afterAll(() => {
    fs.removeSync(testDir);
    fs.removeSync(outputDir);
  });

  it("generates Java files without errors and matches the snapshot", async () => {
    await jest.isolateModulesAsync(async () => {
      // Mock quicktype-core to delegate to actual implementation for this test
      jest.doMock("quicktype-core", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const actual: any = jest.requireActual("quicktype-core");
        return {
          __esModule: true,
          JSONSchemaInput: actual.JSONSchemaInput,
          FetchingJSONSchemaStore: actual.FetchingJSONSchemaStore,
          InputData: actual.InputData,
          // delegate to real quicktype
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-function-return-type
          quicktype: (opts: any) => actual.quicktype(opts),
        };
      });

      // Reload generateModels with mocked quicktype-core
      const { generateModels: genSuccess } = await import("./generateJavaModels.js");
      const config: JavaAnnotationsConfig = {
        packageAnnotations: "com.example.annotations",
        modelPackage: "com.example.model",
      };

      await genSuccess(config, path.join(testDir, "person.schema.yaml"), outputDir);

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
    await jest.isolateModulesAsync(async () => {
      jest.doMock("quicktype-core", () => ({
        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        quicktype() {
          throw new Error("Test-Failure");
        },
        JSONSchemaInput: jest.fn().mockImplementation(() => ({
          addSource: jest.fn(async () => Promise.resolve(undefined)).mockResolvedValue(undefined),
        })),

        FetchingJSONSchemaStore: jest.fn().mockImplementation(() => ({})),
        InputData: jest.fn().mockImplementation(() => ({
          addInput: jest.fn(),
        })),
      }));

      const { log } = await import("../../util/log.js");
      const errorSpyInIso = jest.spyOn(log, "error").mockReturnValue(undefined);

      const { generateModels } = await import("./generateJavaModels.js");
      const config: JavaAnnotationsConfig = {
        packageAnnotations: "com.example.annotations",
        modelPackage: "com.example.model",
      };

      await generateModels(config, path.join(testDir, "person.schema.yaml"), outputDir);

      expect(errorSpyInIso).toHaveBeenCalledWith(expect.stringContaining("quicktype generation failed:"));
    });
  });
});

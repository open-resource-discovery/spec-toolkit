import fs from "fs-extra";
import path from "path";
import spawnAsync from "@expo/spawn-async";
import yaml from "js-yaml";
import { SpecToolkitConfigurationDocument } from "../generated/spec-toolkit-config/spec-v1/types/spec-toolkit-config.js";

describe("CLI generalConfig tests", () => {
  const cliBin = "node";
  const cliScriptPath = "./dist/cli.js";
  const tmpTestDataName = "tmpTestData-cli-e2e-general-config";
  const tmpTestOutputName = "tmpTestOutput-cli-e2e-general-config";
  const tmpTestData = path.join(process.cwd(), "src", "__tests__", tmpTestDataName);
  const tmpTestOutput = path.join(process.cwd(), "src", "__tests__", tmpTestOutputName);

  beforeAll(() => {
    // Create test directories and write a valid JSON schema for Person
    fs.ensureDirSync(tmpTestOutput);
    fs.ensureDirSync(tmpTestData);
    const schema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: "Person",
      type: "object",
      properties: {
        firstName: { "type": "string", "x-hide": true, "x-deprecated-in-version": "1.0.2" },
        lastName: { type: "string" },
      },
      required: ["firstName", "lastName"],
    };
    const schemaPath = path.join(tmpTestData, "person.schema.yaml");
    fs.writeFileSync(schemaPath, yaml.dump(schema), "utf8");
  });

  afterAll(() => {
    fs.removeSync(tmpTestOutput);
    fs.removeSync(tmpTestData);
  });

  describe("Test the generalConfig", () => {
    describe("tsTypeExportExcludeJsFileExtension", () => {
      test("should successfully omit js file extension when tsTypeExportExcludeJsFileExtension is set to true", async () => {
        const config: SpecToolkitConfigurationDocument = {
          $schema: "https://open-resource-discovery.github.io/spec-toolkit/spec-v1/spec-toolkit-config.schema.json#",
          generalConfig: {
            tsTypeExportExcludeJsFileExtension: true, // set to true
          },
          outputPath: `src/__tests__/${tmpTestOutputName}`,
          docsConfig: [
            {
              type: "spec",
              id: "my-spec",
              sourceFilePath: `./src/__tests__/${tmpTestDataName}/person.schema.yaml`,
            },
          ],
        };
        const configFilePath = tmpTestData.concat("/config.json");
        fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

        const cliArguments = [cliScriptPath, "-c", `./src/__tests__/${tmpTestDataName}/config.json`];

        const resultPromise = spawnAsync(cliBin, cliArguments);

        try {
          const { stdout, stderr } = await resultPromise;

          expect(stdout).toContain(
            `SUCCESS: Documentation successfully generated to src/__tests__/${tmpTestOutputName}`,
          );
          // Check that stderr is empty
          expect(stderr).toEqual("");

          // Read output files and check their content
          const indexTypesFileContent = fs.readFileSync(`src/__tests__/${tmpTestOutputName}/types/index.ts`).toString();

          expect(indexTypesFileContent).toMatchSnapshot();
        } catch (e) {
          expect(e).toEqual("expect this to never happen because above code should not throw an error");
        }
      });
      test("should append js file extension when tsTypeExportExcludeJsFileExtension is set to false", async () => {
        const config: SpecToolkitConfigurationDocument = {
          $schema: "https://open-resource-discovery.github.io/spec-toolkit/spec-v1/spec-toolkit-config.schema.json#",
          generalConfig: {
            tsTypeExportExcludeJsFileExtension: false, // set to false
          },
          outputPath: `src/__tests__/${tmpTestOutputName}`,
          docsConfig: [
            {
              type: "spec",
              id: "my-spec",
              sourceFilePath: `./src/__tests__/${tmpTestDataName}/person.schema.yaml`,
            },
          ],
        };
        const configFilePath = tmpTestData.concat("/config.json");
        fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

        const cliArguments = [cliScriptPath, "-c", `./src/__tests__/${tmpTestDataName}/config.json`];

        const resultPromise = spawnAsync(cliBin, cliArguments);

        try {
          const { stdout, stderr } = await resultPromise;

          expect(stdout).toContain(
            `SUCCESS: Documentation successfully generated to src/__tests__/${tmpTestOutputName}`,
          );
          // Check that stderr is empty
          expect(stderr).toEqual("");

          // Read output files and check their content
          const indexTypesFileContent = fs.readFileSync(`src/__tests__/${tmpTestOutputName}/types/index.ts`).toString();

          expect(indexTypesFileContent).toMatchSnapshot();
        } catch (e) {
          expect(e).toEqual("expect this to never happen because above code should not throw an error");
        }
      });

      test("should append js file extension when generalConfig is missing at all", async () => {
        const config: SpecToolkitConfigurationDocument = {
          $schema: "https://open-resource-discovery.github.io/spec-toolkit/spec-v1/spec-toolkit-config.schema.json#",
          outputPath: `src/__tests__/${tmpTestOutputName}`,
          docsConfig: [
            {
              type: "spec",
              id: "my-spec",
              sourceFilePath: `./src/__tests__/${tmpTestDataName}/person.schema.yaml`,
            },
          ],
        };
        const configFilePath = tmpTestData.concat("/config.json");
        fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

        const cliArguments = [cliScriptPath, "-c", `./src/__tests__/${tmpTestDataName}/config.json`];

        const resultPromise = spawnAsync(cliBin, cliArguments);

        try {
          const { stdout, stderr } = await resultPromise;

          expect(stdout).toContain(
            `SUCCESS: Documentation successfully generated to src/__tests__/${tmpTestOutputName}`,
          );
          // Check that stderr is empty
          expect(stderr).toEqual("");

          // Read output files and check their content
          const indexTypesFileContent = fs.readFileSync(`src/__tests__/${tmpTestOutputName}/types/index.ts`).toString();

          expect(indexTypesFileContent).toMatchSnapshot();
        } catch (e) {
          expect(e).toEqual("expect this to never happen because above code should not throw an error");
        }
      });
    });

    describe("preservedCoreSpecificXProperties", () => {
      test("should preserve core specific x- properties in the output JSON Schema when preservedCoreSpecificXProperties is set", async () => {
        const config: SpecToolkitConfigurationDocument = {
          $schema: "https://open-resource-discovery.github.io/spec-toolkit/spec-v1/spec-toolkit-config.schema.json#",
          generalConfig: {
            preservedCoreSpecificXProperties: ["x-hide", "x-deprecated-in-version"], // set to preserve core spec-toolkit specific x- properties
          },
          outputPath: `src/__tests__/${tmpTestOutputName}`,
          docsConfig: [
            {
              type: "spec",
              id: "my-spec",
              sourceFilePath: `./src/__tests__/${tmpTestDataName}/person.schema.yaml`,
            },
          ],
        };
        const configFilePath = tmpTestData.concat("/config.json");
        fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

        const cliArguments = [cliScriptPath, "-c", `./src/__tests__/${tmpTestDataName}/config.json`];

        const resultPromise = spawnAsync(cliBin, cliArguments);

        try {
          const { stdout, stderr } = await resultPromise;

          expect(stdout).toContain(
            `SUCCESS: Documentation successfully generated to src/__tests__/${tmpTestOutputName}`,
          );
          // Check that stderr is empty
          expect(stderr).toEqual("");

          // Read output JSON Schema and check that the core specific x- property is preserved
          const outputSchemaContent = fs
            .readFileSync(`src/__tests__/${tmpTestOutputName}/schemas/my-spec.schema.json`)
            .toString();
          const outputSchema = JSON.parse(outputSchemaContent);

          expect(outputSchema.properties.firstName).toHaveProperty("x-hide");
          expect(outputSchema.properties.firstName).toHaveProperty("x-deprecated-in-version");
        } catch (e) {
          expect(e).toEqual("expect this to never happen because above code should not throw an error");
        }
      });
      test("should NOT preserve core specific x- properties in the output JSON Schema when preservedCoreSpecificXProperties are NOT set", async () => {
        const config: SpecToolkitConfigurationDocument = {
          $schema: "https://open-resource-discovery.github.io/spec-toolkit/spec-v1/spec-toolkit-config.schema.json#",
          generalConfig: {
            preservedCoreSpecificXProperties: [], // set to preserve core spec-toolkit specific x- properties
          },
          outputPath: `src/__tests__/${tmpTestOutputName}`,
          docsConfig: [
            {
              type: "spec",
              id: "my-spec",
              sourceFilePath: `./src/__tests__/${tmpTestDataName}/person.schema.yaml`,
            },
          ],
        };
        const configFilePath = tmpTestData.concat("/config.json");
        fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

        const cliArguments = [cliScriptPath, "-c", `./src/__tests__/${tmpTestDataName}/config.json`];

        const resultPromise = spawnAsync(cliBin, cliArguments);

        try {
          const { stdout, stderr } = await resultPromise;

          expect(stdout).toContain(
            `SUCCESS: Documentation successfully generated to src/__tests__/${tmpTestOutputName}`,
          );
          // Check that stderr is empty
          expect(stderr).toEqual("");

          // Read output JSON Schema and check that the core specific x- property is preserved
          const outputSchemaContent = fs
            .readFileSync(`src/__tests__/${tmpTestOutputName}/schemas/my-spec.schema.json`)
            .toString();
          const outputSchema = JSON.parse(outputSchemaContent);

          expect(outputSchema.properties.firstName).not.toHaveProperty("x-hide");
          expect(outputSchema.properties.firstName).not.toHaveProperty("x-deprecated-in-version");
        } catch (e) {
          expect(e).toEqual("expect this to never happen because above code should not throw an error");
        }
      });
    });
  });
});

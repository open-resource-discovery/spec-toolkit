import fs from "fs-extra";
import path from "path";
import spawnAsync from "@expo/spawn-async";
import yaml from "js-yaml";
import { SpecToolkitConfigurationDocument } from "../generated/spec-toolkit-config/spec-v1/types/spec-toolkit-config.js";

describe("CLI plugin config tests", () => {
  const cliBin = "node";
  const cliScriptPath = "./dist/cli.js";
  const tmpTestDataName = "tmpTestData-cli-e2e-plugin-config";
  const tmpTestOutputName = "tmpTestOutput-cli-e2e-plugin-config";
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
        firstName: { type: "string" },
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

  describe("Test the plugin config", () => {
    describe("plugin packageName", () => {
      test("should successfully register and execute a plugin if configured", async () => {
        const config: SpecToolkitConfigurationDocument = {
          $schema: "https://open-resource-discovery.github.io/spec-toolkit/spec-v1/spec-toolkit-config.schema.json#",
          plugins: [
            {
              packageName: "./src/plugin/tabular/index.ts",
            },
          ],
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
          const tabularPluginGeneratedContent = fs.readdirSync(`src/__tests__/${tmpTestOutputName}/plugin/tabular`);

          expect(tabularPluginGeneratedContent.length).toEqual(2);
        } catch (e) {
          expect(e).toEqual("expect this to never happen because above code should not throw an error");
        }
      });

      test("should successfully preserve plugin specific x- properties in the output JSON schema if configured", async () => {
        const schemaWithxUmsPropertyToPreserve = {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "title": "Person",
          "type": "object",
          "x-ums-type": "root",
          "properties": {
            firstName: { type: "string" },
            lastName: { type: "string" },
          },
          "required": ["firstName", "lastName"],
        };
        const schemaPath = path.join(tmpTestData, "personWithXUmsProperty.schema.yaml");
        fs.writeFileSync(schemaPath, yaml.dump(schemaWithxUmsPropertyToPreserve), "utf8");
        const config: SpecToolkitConfigurationDocument = {
          $schema: "https://open-resource-discovery.github.io/spec-toolkit/spec-v1/spec-toolkit-config.schema.json#",
          plugins: [
            {
              packageName: "./src/plugin/ums/index.ts",
              options: {
                preservedPluginSpecificXProperties: ["x-ums-type"],
              },
            },
          ],
          outputPath: `src/__tests__/${tmpTestOutputName}`,
          docsConfig: [
            {
              type: "spec",
              id: "my-spec",
              sourceFilePath: `./src/__tests__/${tmpTestDataName}/personWithXUmsProperty.schema.yaml`,
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
          const schemaContent = fs
            .readFileSync(`src/__tests__/${tmpTestOutputName}/schemas/my-spec.schema.json`)
            .toString();

          expect(schemaContent).toMatchSnapshot();
        } catch (e) {
          expect(e).toEqual("expect this to never happen because above code should not throw an error");
        }
      });
    });
  });
});

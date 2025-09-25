import fs from "fs-extra";
import path from "path";
import spawnAsync from "@expo/spawn-async";
import yaml from "js-yaml";
import { SpecToolkitConfigurationDocument } from "../generated/spec-toolkit-config/spec-v1/types/spec-toolkit-config.js";

describe("CLI general config tests", () => {
  const cliBin = "node";
  const cliScriptPath = "./dist/cli.js";
  const tmpTestData = path.join(process.cwd(), "src", "__tests__", "tmpTestData");
  const tmpTestOutput = path.join(process.cwd(), "src", "__tests__", "tmpTestOutput");

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

  describe("Test the general config options", () => {
    describe("Test for tsTypeExportExcludeJsFileExtension", () => {
      test("should successfully omit js file extension when tsTypeExportExcludeJsFileExtension is set to true", async () => {
        const config: SpecToolkitConfigurationDocument = {
          $schema: "https://open-resource-discovery.github.io/spec-toolkit/spec-v1/spec-toolkit-config.schema.json#",
          generalConfig: {
            tsTypeExportExcludeJsFileExtension: true, // set to true
          },
          outputPath: "src/__tests__/tmpTestOutput",
          docsConfig: [
            {
              type: "spec",
              id: "my-spec",
              sourceFilePath: "./src/__tests__/tmpTestData/person.schema.yaml",
            },
          ],
        };
        const configFilePath = tmpTestData.concat("/config.json");
        fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

        const cliArguments = [cliScriptPath, "-c", "./src/__tests__/tmpTestData/config.json"];

        const resultPromise = spawnAsync(cliBin, cliArguments);

        try {
          const { stdout, stderr } = await resultPromise;

          expect(stdout).toContain("SUCCESS: Documentation successfully generated to src/__tests__/tmpTestOutput");
          // Check that stderr is empty
          expect(stderr).toEqual("");

          // Read output files and check their content
          const indexTypesFileContent = fs.readFileSync("src/__tests__/tmpTestOutput/types/index.ts").toString();

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
          outputPath: "src/__tests__/tmpTestOutput",
          docsConfig: [
            {
              type: "spec",
              id: "my-spec",
              sourceFilePath: "./src/__tests__/tmpTestData/person.schema.yaml",
            },
          ],
        };
        const configFilePath = tmpTestData.concat("/config.json");
        fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

        const cliArguments = [cliScriptPath, "-c", "./src/__tests__/tmpTestData/config.json"];

        const resultPromise = spawnAsync(cliBin, cliArguments);

        try {
          const { stdout, stderr } = await resultPromise;

          expect(stdout).toContain("SUCCESS: Documentation successfully generated to src/__tests__/tmpTestOutput");
          // Check that stderr is empty
          expect(stderr).toEqual("");

          // Read output files and check their content
          const indexTypesFileContent = fs.readFileSync("src/__tests__/tmpTestOutput/types/index.ts").toString();

          expect(indexTypesFileContent).toMatchSnapshot();
        } catch (e) {
          expect(e).toEqual("expect this to never happen because above code should not throw an error");
        }
      });

      test("should append js file extension when generalConfig is missing at all", async () => {
        const config: SpecToolkitConfigurationDocument = {
          $schema: "https://open-resource-discovery.github.io/spec-toolkit/spec-v1/spec-toolkit-config.schema.json#",
          outputPath: "src/__tests__/tmpTestOutput",
          docsConfig: [
            {
              type: "spec",
              id: "my-spec",
              sourceFilePath: "./src/__tests__/tmpTestData/person.schema.yaml",
            },
          ],
        };
        const configFilePath = tmpTestData.concat("/config.json");
        fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

        const cliArguments = [cliScriptPath, "-c", "./src/__tests__/tmpTestData/config.json"];

        const resultPromise = spawnAsync(cliBin, cliArguments);

        try {
          const { stdout, stderr } = await resultPromise;

          expect(stdout).toContain("SUCCESS: Documentation successfully generated to src/__tests__/tmpTestOutput");
          // Check that stderr is empty
          expect(stderr).toEqual("");

          // Read output files and check their content
          const indexTypesFileContent = fs.readFileSync("src/__tests__/tmpTestOutput/types/index.ts").toString();

          expect(indexTypesFileContent).toMatchSnapshot();
        } catch (e) {
          expect(e).toEqual("expect this to never happen because above code should not throw an error");
        }
      });
    });
  });
});

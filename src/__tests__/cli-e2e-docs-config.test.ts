import fs from "fs-extra";
import path from "path";
import spawnAsync from "@expo/spawn-async";
import yaml from "js-yaml";
import { SpecToolkitConfigurationDocument } from "../generated/spec-toolkit-config/spec-v1/types/spec-toolkit-config.js";

describe("CLI docsConfig tests", () => {
  const cliBin = "node";
  const cliScriptPath = "./dist/cli.js";
  const tmpTestDataName = "tmpTestData-cli-e2e-docs-config";
  const tmpTestOutputName = "tmpTestOutput-cli-e2e-docs-config";
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

  describe("Test the docsConfig", () => {
    describe("Test the SpecConfig", () => {
      describe("examplesFolderPath", () => {
        test("should successfully generate md examples when examplesFolderPath is configured and contains .json files", async () => {
          const config: SpecToolkitConfigurationDocument = {
            $schema: "https://open-resource-discovery.github.io/spec-toolkit/spec-v1/spec-toolkit-config.schema.json#",
            outputPath: `src/__tests__/${tmpTestOutputName}`,
            docsConfig: [
              {
                type: "spec",
                id: "my-spec",
                sourceFilePath: `./src/__tests__/${tmpTestDataName}/person.schema.yaml`,
                examplesFolderPath: `./src/__tests__/${tmpTestDataName}/examples1`,
              },
            ],
          };
          const configFilePath = tmpTestData.concat("/config.json");
          fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

          const example1 = {
            firstName: "John",
            lastName: "Doe",
          };
          const example2 = {
            firstName: "Jane",
            lastName: "Smith",
          };
          const examplesDir = path.join(tmpTestData, "examples1");
          fs.ensureDirSync(examplesDir);
          fs.writeFileSync(path.join(examplesDir, "example1.json"), JSON.stringify(example1), "utf8");
          fs.writeFileSync(path.join(examplesDir, "example2.json"), JSON.stringify(example2), "utf8");

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
            const example1FileContent = fs
              .readFileSync(`src/__tests__/${tmpTestOutputName}/docs/examples/example1.md`)
              .toString();
            const example2FileContent = fs
              .readFileSync(`src/__tests__/${tmpTestOutputName}/docs/examples/example2.md`)
              .toString();

            expect(example1FileContent).toMatchSnapshot();
            expect(example2FileContent).toMatchSnapshot();
          } catch (e) {
            expect(e).toEqual("expect this to never happen because above code should not throw an error");
          }
        });

        test("should successfully generate md examples when examplesFolderPath is configured and contains .jsonc files", async () => {
          const config: SpecToolkitConfigurationDocument = {
            $schema: "https://open-resource-discovery.github.io/spec-toolkit/spec-v1/spec-toolkit-config.schema.json#",
            outputPath: `src/__tests__/${tmpTestOutputName}`,
            docsConfig: [
              {
                type: "spec",
                id: "my-spec",
                sourceFilePath: `./src/__tests__/${tmpTestDataName}/person.schema.yaml`,
                examplesFolderPath: `./src/__tests__/${tmpTestDataName}/examples2`,
              },
            ],
          };
          const configFilePath = tmpTestData.concat("/config.json");
          fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

          const example1 = `{
            // this is a comment in jsonc
            "firstName": "John",
            "lastName": "Doe",
          }`;
          const example2 = `{
            // this is a second comment in jsonc
            "firstName": "Jane",
            "lastName": "Smith",
          }`;
          const examplesDir = path.join(tmpTestData, "examples2");
          fs.ensureDirSync(examplesDir);
          fs.writeFileSync(path.join(examplesDir, "example1.jsonc"), example1, "utf8");
          fs.writeFileSync(path.join(examplesDir, "example2.jsonc"), example2, "utf8");

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
            const example1FileContent = fs
              .readFileSync(`src/__tests__/${tmpTestOutputName}/docs/examples/example1.md`)
              .toString();
            const example2FileContent = fs
              .readFileSync(`src/__tests__/${tmpTestOutputName}/docs/examples/example2.md`)
              .toString();

            expect(example1FileContent).toMatchSnapshot();
            expect(example2FileContent).toMatchSnapshot();
          } catch (e) {
            expect(e).toEqual("expect this to never happen because above code should not throw an error");
          }
        });

        test("should successfully generate md examples when examplesFolderPath is configured and contains .json and .jsonc files", async () => {
          const config: SpecToolkitConfigurationDocument = {
            $schema: "https://open-resource-discovery.github.io/spec-toolkit/spec-v1/spec-toolkit-config.schema.json#",
            outputPath: `src/__tests__/${tmpTestOutputName}`,
            docsConfig: [
              {
                type: "spec",
                id: "my-spec",
                sourceFilePath: `./src/__tests__/${tmpTestDataName}/person.schema.yaml`,
                examplesFolderPath: `./src/__tests__/${tmpTestDataName}/examples3`,
              },
            ],
          };
          const configFilePath = tmpTestData.concat("/config.json");
          fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

          const example1 = `{
            // this is a comment in jsonc
            "firstName": "John",
            "lastName": "Doe",
          }`;
          const example2 = {
            firstName: "Jane",
            lastName: "Smith",
          };
          const examplesDir = path.join(tmpTestData, "examples3");
          fs.ensureDirSync(examplesDir);
          fs.writeFileSync(path.join(examplesDir, "example1.jsonc"), example1, "utf8");
          fs.writeFileSync(path.join(examplesDir, "example2.json"), JSON.stringify(example2), "utf8");

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
            const example1FileContent = fs
              .readFileSync(`src/__tests__/${tmpTestOutputName}/docs/examples/example1.md`)
              .toString();
            const example2FileContent = fs
              .readFileSync(`src/__tests__/${tmpTestOutputName}/docs/examples/example2.md`)
              .toString();

            expect(example1FileContent).toMatchSnapshot();
            expect(example2FileContent).toMatchSnapshot();
          } catch (e) {
            expect(e).toEqual("expect this to never happen because above code should not throw an error");
          }
        });
        test("should successfully generate md examples when examplesFolderPath is configured and contains .json and .jsonc files with intro and outro", async () => {
          const config: SpecToolkitConfigurationDocument = {
            $schema: "https://open-resource-discovery.github.io/spec-toolkit/spec-v1/spec-toolkit-config.schema.json#",
            outputPath: `src/__tests__/${tmpTestOutputName}`,
            docsConfig: [
              {
                type: "spec",
                id: "my-spec",
                sourceFilePath: `./src/__tests__/${tmpTestDataName}/person.schema.yaml`,
                examplesFolderPath: `./src/__tests__/${tmpTestDataName}/examples4`,
              },
            ],
          };
          const configFilePath = tmpTestData.concat("/config.json");
          fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

          const example1Intro = "This is an example introduction for example1.";
          const example1 = `{
            // this is a comment in jsonc
            "firstName": "John",
            "lastName": "Doe",
          }`;
          const example1Outro = "This is an example outro for example1.";
          const example2Intro = "This is an example introduction for example2.";
          const example2 = {
            firstName: "Jane",
            lastName: "Smith",
          };
          const example2Outro = "This is an example outro for example2.";
          const examplesDir = path.join(tmpTestData, "examples4");
          fs.ensureDirSync(examplesDir);
          fs.writeFileSync(path.join(examplesDir, "example1.intro.md"), example1Intro, "utf8");
          fs.writeFileSync(path.join(examplesDir, "example1.jsonc"), example1, "utf8");
          fs.writeFileSync(path.join(examplesDir, "example1.outro.md"), example1Outro, "utf8");
          fs.writeFileSync(path.join(examplesDir, "example2.intro.md"), example2Intro, "utf8");
          fs.writeFileSync(path.join(examplesDir, "example2.json"), JSON.stringify(example2), "utf8");
          fs.writeFileSync(path.join(examplesDir, "example2.outro.md"), example2Outro, "utf8");

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
            const example1FileContent = fs
              .readFileSync(`src/__tests__/${tmpTestOutputName}/docs/examples/example1.md`)
              .toString();
            const example2FileContent = fs
              .readFileSync(`src/__tests__/${tmpTestOutputName}/docs/examples/example2.md`)
              .toString();

            expect(example1FileContent).toMatchSnapshot();
            expect(example2FileContent).toMatchSnapshot();
          } catch (e) {
            expect(e).toEqual("expect this to never happen because above code should not throw an error");
          }
        });
        test("should validate provided examples in examplesFolderPath against the generated output JSON schema", async () => {
          const config: SpecToolkitConfigurationDocument = {
            $schema: "https://open-resource-discovery.github.io/spec-toolkit/spec-v1/spec-toolkit-config.schema.json#",
            outputPath: `src/__tests__/${tmpTestOutputName}`,
            docsConfig: [
              {
                type: "spec",
                id: "my-spec",
                sourceFilePath: `./src/__tests__/${tmpTestDataName}/person.schema.yaml`,
                examplesFolderPath: `./src/__tests__/${tmpTestDataName}/examples5`,
              },
            ],
          };
          const configFilePath = tmpTestData.concat("/config.json");
          fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

          // this is an invalid example, property "lastName" is missing
          const example1 = {
            firstName: "Jane",
            // lastName: "Smith",
          };
          const examplesDir = path.join(tmpTestData, "examples5");
          fs.ensureDirSync(examplesDir);
          fs.writeFileSync(path.join(examplesDir, "example1.json"), JSON.stringify(example1), "utf8");

          const cliArguments = [cliScriptPath, "-c", `./src/__tests__/${tmpTestDataName}/config.json`];

          const resultPromise = spawnAsync(cliBin, cliArguments);

          try {
            await resultPromise;
            // expect this to never happen because above code should throw an error
            expect(1).toEqual(2);
          } catch (e) {
            expect((e as Error).message).toContain("exited with non-zero code: 1");
            expect((e as spawnAsync.SpawnResult).output[0]).toContain(
              "Example ./src/__tests__/tmpTestData-cli-docs-config/examples5/example1.json is not valid",
            );
          }
        });
      });
    });
  });
});

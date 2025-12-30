import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";
import { SpecToolkitConfigurationDocument } from "./index.js";
import { generateExampleDocumentation } from "./generateExampleDocumentation.js";
import { log } from "./util/log.js";
import { jest } from "@jest/globals";

describe("test generateExampleDocumentation", () => {
  const tmpTestDataName = "tmpTestData-generateExampleDocumentation";
  const tmpTestOutputName = "tmpTestOutput-cli-general-config";
  const tmpTestData = path.join(process.cwd(), "src", "__tests__", tmpTestDataName);
  const tmpTestOutput = path.join(process.cwd(), "src", "__tests__", tmpTestOutputName);

  beforeEach(() => {
    // Create test directory and write a valid JSON schema for Person
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
    const inputSchemaPath = path.join(tmpTestData, "person.schema.yaml");
    fs.writeFileSync(inputSchemaPath, yaml.dump(schema), "utf8");
    const outputSchemaPath = path.join(tmpTestOutput, "schemas", "person.schema.json");
    fs.outputFileSync(outputSchemaPath, JSON.stringify(schema));
  });

  afterEach(() => {
    fs.removeSync(tmpTestOutput);
    fs.removeSync(tmpTestData);
  });

  test("should generate md files for .json and .jsonc examples including intro/outro", () => {
    const examplesDir = `./src/__tests__/${tmpTestDataName}/examples`;
    const config: SpecToolkitConfigurationDocument = {
      $schema: "https://open-resource-discovery.github.io/spec-toolkit/spec-v1/spec-toolkit-config.schema.json#",
      outputPath: `src/__tests__/${tmpTestOutputName}`,
      docsConfig: [
        {
          type: "spec",
          id: "person",
          sourceFilePath: `./src/__tests__/${tmpTestDataName}/person.schema.yaml`,
          examplesFolderPath: examplesDir,
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
    const example3 = {
      firstName: "Mary",
      lastName: "Poppins",
    };
    fs.ensureDirSync(examplesDir);
    fs.writeFileSync(path.join(examplesDir, "example1.intro.md"), example1Intro, "utf8");
    fs.writeFileSync(path.join(examplesDir, "example1.jsonc"), example1, "utf8");
    fs.writeFileSync(path.join(examplesDir, "example1.outro.md"), example1Outro, "utf8");
    fs.writeFileSync(path.join(examplesDir, "example2.intro.md"), example2Intro, "utf8");
    fs.writeFileSync(path.join(examplesDir, "example2.json"), JSON.stringify(example2), "utf8");
    fs.writeFileSync(path.join(examplesDir, "example2.outro.md"), example2Outro, "utf8");
    fs.writeFileSync(path.join(examplesDir, "example3.json"), JSON.stringify(example3), "utf8");

    generateExampleDocumentation(config);

    // Read output files and check their content
    const example1FileContent = fs
      .readFileSync(`src/__tests__/${tmpTestOutputName}/docs/examples/example1.md`)
      .toString();
    const example2FileContent = fs
      .readFileSync(`src/__tests__/${tmpTestOutputName}/docs/examples/example2.md`)
      .toString();
    const example3FileContent = fs
      .readFileSync(`src/__tests__/${tmpTestOutputName}/docs/examples/example3.md`)
      .toString();

    expect(example1FileContent).toMatchSnapshot();
    expect(example2FileContent).toMatchSnapshot();
    expect(example3FileContent).toMatchSnapshot();
  });

  test("should skip when no example files found", () => {
    const examplesDir = `./src/__tests__/${tmpTestDataName}/examples`;
    const config: SpecToolkitConfigurationDocument = {
      $schema: "https://open-resource-discovery.github.io/spec-toolkit/spec-v1/spec-toolkit-config.schema.json#",
      outputPath: `src/__tests__/${tmpTestOutputName}`,
      docsConfig: [
        {
          type: "spec",
          id: "person",
          sourceFilePath: `./src/__tests__/${tmpTestDataName}/person.schema.yaml`,
          examplesFolderPath: examplesDir,
        },
      ],
    };
    const configFilePath = tmpTestData.concat("/config.json");
    fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

    const spyOnLogInfo = jest.spyOn(log, "info");
    const spyOnFsOutputFileSync = jest.spyOn(fs, "outputFileSync");

    generateExampleDocumentation(config);

    expect(spyOnLogInfo).toHaveBeenCalledWith(
      `No example files found in folder "${examplesDir}". Skipping example documentation generation.`,
    );
    expect(spyOnFsOutputFileSync).not.toHaveBeenCalled();
  });

  test("should exit when example validation fails", () => {
    const examplesDir = `./src/__tests__/${tmpTestDataName}/examples`;
    const config: SpecToolkitConfigurationDocument = {
      $schema: "https://open-resource-discovery.github.io/spec-toolkit/spec-v1/spec-toolkit-config.schema.json#",
      outputPath: `src/__tests__/${tmpTestOutputName}`,
      docsConfig: [
        {
          type: "spec",
          id: "person",
          sourceFilePath: `./src/__tests__/${tmpTestDataName}/person.schema.yaml`,
          examplesFolderPath: examplesDir,
        },
      ],
    };
    const configFilePath = tmpTestData.concat("/config.json");
    fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

    const exampleIntro = "This is an example introduction for example2.";
    const example = {
      firstName: "Jane",
      // broken example, missing mandatory property lastName
      // lastName: "Smith",
    };
    const exampleOutro = "This is an example outro for example2.";
    fs.ensureDirSync(examplesDir);
    fs.writeFileSync(path.join(examplesDir, "example2.intro.md"), exampleIntro, "utf8");
    fs.writeFileSync(path.join(examplesDir, "example2.json"), JSON.stringify(example), "utf8");
    fs.writeFileSync(path.join(examplesDir, "example2.outro.md"), exampleOutro, "utf8");

    const spyOnLogError = jest.spyOn(log, "error");
    const spyOnProcessExit = jest.spyOn(process, "exit").mockImplementation(() => undefined as never);

    generateExampleDocumentation(config);

    expect(spyOnLogError).toHaveBeenCalledWith(expect.stringContaining("is not valid"));
    expect(spyOnProcessExit).toHaveBeenCalledWith(1);
  });
});

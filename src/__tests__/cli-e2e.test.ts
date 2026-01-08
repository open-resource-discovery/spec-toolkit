import * as fs from "fs";
import spawnAsync from "@expo/spawn-async";

describe("CLI End-to-End Tests", () => {
  const cliBin = "node";
  const cliScriptPath = "./dist/cli.js";

  // This test should ensure that we can run the CLI end-to-end
  test("test 1: successful run with valid configuration and valid schema file", async () => {
    const configFile = "./src/__tests__/testData/valid/test1-my-spec-config.json";
    const cliArguments = [cliScriptPath, "-c", configFile];

    const resultPromise = spawnAsync(cliBin, cliArguments);

    try {
      const { stdout, stderr } = await resultPromise;

      expect(stdout).toContain(
        "SUCCESS: Documentation successfully generated to src/__tests__/generated/test1/my-spec-v1",
      );

      // Check that stdout is like expected and not suspiciously long (accidental console.logs)
      expect(stdout.length).toBeLessThan(7250);

      // Check that stderr is empty
      expect(stderr).toEqual("");

      // Read output files and check their content
      const mdFileContent = fs.readFileSync("src/__tests__/generated/test1/my-spec-v1/docs/my-spec.md").toString();
      const schemaFileContent = fs
        .readFileSync("src/__tests__/generated/test1/my-spec-v1/schemas/my-spec.schema.json")
        .toString();
      const typesFileContent = fs.readFileSync("src/__tests__/generated/test1/my-spec-v1/types/my-spec.ts").toString();

      expect(mdFileContent).toMatchSnapshot();
      expect(schemaFileContent).toMatchSnapshot();
      expect(typesFileContent).toMatchSnapshot();
    } catch (e) {
      expect(e).toEqual("expect this to never happen because above code should not throw an error");
    }
  });

  // This test should ensure that the CLI detects an invalid configuration file
  test("test 2: failed run with invalid configuration file and valid schema file", async () => {
    const configFile = "./src/__tests__/testData/invalid/test2-my-spec-config.json";
    const cliArguments = [cliScriptPath, "-c", configFile];

    const resultPromise = spawnAsync(cliBin, cliArguments);

    try {
      await resultPromise;
      // expect this to never happen because above code should throw an error
      expect(1).toEqual(2);
    } catch (e) {
      expect((e as spawnAsync.SpawnResult).stderr).toContain("Validation of Config JSON Schema file");
      expect((e as spawnAsync.SpawnResult).stderr).toContain("failed with errors");
      expect((e as spawnAsync.SpawnResult).stderr).toContain("must have required property 'outputPath'");
    }
  });

  // This test should ensure that the CLI detects an invalid schema file
  test("test 3: failed run with valid configuration file and invalid schema file", async () => {
    const configFile = "./src/__tests__/testData/valid/test3-my-spec-config.json";
    const cliArguments = [cliScriptPath, "-c", configFile];

    const resultPromise = spawnAsync(cliBin, cliArguments);

    try {
      await resultPromise;
      // expect this to never happen because above code should throw an error
      expect(1).toEqual(2);
    } catch (e) {
      expect((e as spawnAsync.SpawnResult).stderr).toContain("Validation of Spec JSON Schema file");
      expect((e as spawnAsync.SpawnResult).stderr).toContain("failed with errors");
      expect((e as spawnAsync.SpawnResult).stderr).toContain(
        'Invalid $ref \\"#/definitions/Meta\\", pointing to unknown definition.',
      );
    }
  });

  test("test 4: successful run with valid configuration file and valid spec extension schema files", async () => {
    const configFile = "./src/__tests__/testData/valid/test4-my-spec-config.json";
    const cliArguments = [cliScriptPath, "-c", configFile];

    const resultPromise = spawnAsync(cliBin, cliArguments);

    try {
      const { stdout, stderr } = await resultPromise;

      expect(stdout).toContain(
        "SUCCESS: Documentation successfully generated to src/__tests__/generated/test4/my-spec-v1",
      );

      // Check that stderr is empty
      expect(stderr).toEqual("");

      // Read output files and check their content
      const mdFileContent = fs.readFileSync("src/__tests__/generated/test4/my-spec-v1/docs/my-spec.md").toString();
      const mdFileContentExtension1 = fs
        .readFileSync("src/__tests__/generated/test4/my-spec-v1/docs/extensions/my-spec-extension-1.md")
        .toString();
      const mdFileContentExtension2 = fs
        .readFileSync("src/__tests__/generated/test4/my-spec-v1/docs/extensions/my-spec-extension-1.md")
        .toString();
      const schemaFileContent = fs
        .readFileSync("src/__tests__/generated/test4/my-spec-v1/schemas/my-spec.schema.json")
        .toString();
      const schemaFileContentExtension1 = fs
        .readFileSync("src/__tests__/generated/test4/my-spec-v1/schemas/my-spec-extension-1.schema.json")
        .toString();
      const schemaFileContentExtension2 = fs
        .readFileSync("src/__tests__/generated/test4/my-spec-v1/schemas/my-spec-extension-1.schema.json")
        .toString();
      const typesFileContent = fs.readFileSync("src/__tests__/generated/test4/my-spec-v1/types/my-spec.ts").toString();

      expect(mdFileContent).toMatchSnapshot();
      expect(mdFileContentExtension1).toMatchSnapshot();
      expect(mdFileContentExtension2).toMatchSnapshot();
      expect(schemaFileContent).toMatchSnapshot();
      expect(schemaFileContentExtension1).toMatchSnapshot();
      expect(schemaFileContentExtension2).toMatchSnapshot();
      expect(typesFileContent).toMatchSnapshot();
    } catch (e) {
      expect(e).toEqual("expect this to never happen because above code should not throw an error");
    }
  });
});

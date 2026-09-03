import * as fs from "node:fs";
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
      expect((e as spawnAsync.SpawnResult).stderr).toContain('Could not resolve $ref "#/definitions/Meta"');
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

  // Tolerant mode: a deliberately non-convention-clean schema (inline nested
  // objects, an inline oneOf branch, a node missing `type`, and an allOf
  // if/then conditional) MUST still generate documentation. Deviations are
  // warned about (stderr is not required to be empty), TypeScript type
  // generation for the conditional schema is skipped, and the run succeeds.
  test("test 5: tolerant run with a non-convention-clean schema still generates docs", async () => {
    const configFile = "./src/__tests__/testData/valid/test5-my-tolerant-spec-config.json";
    const cliArguments = [cliScriptPath, "-c", configFile];

    const { stdout } = await spawnAsync(cliBin, cliArguments);

    expect(stdout).toContain(
      "SUCCESS: Documentation successfully generated to src/__tests__/generated/test5/my-tolerant-spec-v1",
    );
    // Normalization warnings are surfaced rather than causing a failure.
    expect(stdout).toContain("Normalized:");
    // TypeScript type generation for the conditional schema is skipped, not fatal.
    expect(stdout).toContain("Skipping TypeScript type generation");

    const mdFileContent = fs
      .readFileSync("src/__tests__/generated/test5/my-tolerant-spec-v1/docs/my-tolerant-spec.md")
      .toString();
    // Inline nested objects were hoisted into linked definitions.
    expect(mdFileContent).toContain("[Metadata](#metadata)");
    expect(mdFileContent).toContain("### Target");
    // The allOf if/then conditional is surfaced as a note.
    expect(mdFileContent).toContain("conditional requirements");
    expect(mdFileContent).toMatchSnapshot();
  });
});

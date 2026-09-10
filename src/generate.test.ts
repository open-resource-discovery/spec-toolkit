import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { generate } from "./generate.js";
import type { SpecToolkitConfigurationDocument } from "./generated/spec-toolkit-config/spec-v1/types/index.js";
import { createGenerationContext } from "./generationContext.js";
import PluginManager from "./plugin/pluginManager.js";
import { afterEach, describe, expect, test } from "./testHelpers/nodeTest.js";

describe("generate", () => {
  const testDirectories: string[] = [];

  afterEach(() => {
    for (const testDirectory of testDirectories.splice(0)) {
      fs.removeSync(testDirectory);
    }
  });

  test("runs against an explicit working directory without changing process state", async () => {
    const workingDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "spec-toolkit-context-"));
    testDirectories.push(workingDirectory);
    const originalWorkingDirectory = process.cwd();
    const schema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      $id: "https://example.test/person.schema.json",
      title: "Person",
      description: "A person.",
      type: "object",
      properties: { name: { title: "Name", description: "The person's name.", type: "string" } },
      required: ["name"],
      additionalProperties: false,
    };
    const config: SpecToolkitConfigurationDocument = {
      outputPath: "generated",
      docsConfig: [
        {
          type: "spec",
          id: "person",
          sourceFilePath: "schemas/person.yaml",
          sourceIntroFilePath: "schemas/person.intro.md",
          examplesFolderPath: "examples",
        },
      ],
    };

    fs.outputFileSync(path.join(workingDirectory, "schemas/person.yaml"), JSON.stringify(schema));
    fs.outputFileSync(path.join(workingDirectory, "schemas/person.intro.md"), "# Person specification\n");
    fs.outputFileSync(path.join(workingDirectory, "examples/person.json"), JSON.stringify({ name: "Ada" }));

    await generate(config, new PluginManager(), createGenerationContext(config, workingDirectory));

    expect(process.cwd()).toBe(originalWorkingDirectory);
    expect(fs.readFileSync(path.join(workingDirectory, "generated/docs/person.md"), "utf8")).toContain(
      "# Person specification",
    );
    expect(fs.readFileSync(path.join(workingDirectory, "generated/docs/examples/person.md"), "utf8")).toContain(
      '"name":"Ada"',
    );
    expect(
      JSON.parse(fs.readFileSync(path.join(workingDirectory, "generated/schemas/person.schema.json"), "utf8")),
    ).toMatchObject({
      title: "Person",
      additionalProperties: false,
    });
    expect(fs.readFileSync(path.join(workingDirectory, "generated/types/person.ts"), "utf8")).toContain(
      "export interface Person",
    );
    expect(fs.readFileSync(path.join(workingDirectory, "generated/types/index.ts"), "utf8")).toBe(
      'export * from "./person.js";\n',
    );
  });
});

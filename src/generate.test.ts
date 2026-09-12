import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { generate } from "./generate.js";
import type {
  PluginOptions,
  SpecToolkitConfigurationDocument,
} from "./generated/spec-toolkit-config/spec-v1/types/index.js";
import { createGenerationContext } from "./generationContext.js";
import registerPlugins from "./plugin/index.js";
import PluginManager from "./plugin/pluginManager.js";
import { afterEach, describe, expect, test } from "./testHelpers/nodeTest.js";

interface PluginInvocation {
  sourceFilePaths: string[];
  outputPath: string;
  options: PluginOptions | undefined;
}

class RecordingPluginManager extends PluginManager {
  public invocation: PluginInvocation | undefined;

  public override loadPluginInstance<T>(): T {
    return {
      generate: (sourceFilePaths: string[], outputPath: string, options?: PluginOptions) => {
        this.invocation = { sourceFilePaths, outputPath, options };
      },
    } as T;
  }
}

function readGeneratedTree(rootDirectory: string): Record<string, string> {
  const files: Record<string, string> = {};

  function visit(directory: string): void {
    for (const entry of fs
      .readdirSync(directory, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))) {
      const filePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(filePath);
      } else {
        files[path.relative(rootDirectory, filePath).split(path.sep).join("/")] = fs.readFileSync(filePath, "utf8");
      }
    }
  }

  visit(rootDirectory);
  return files;
}

const personSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://example.test/person.schema.json",
  title: "Person",
  description: "A person.",
  type: "object",
  properties: { name: { title: "Name", description: "The person's name.", type: "string" } },
  required: ["name"],
  additionalProperties: false,
};

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
      plugins: [{ packageName: "example-plugin", options: { outputFormat: "compact" } }],
    };

    fs.outputFileSync(path.join(workingDirectory, "schemas/person.yaml"), JSON.stringify(personSchema));
    fs.outputFileSync(path.join(workingDirectory, "schemas/person.intro.md"), "# Person specification\n");
    fs.outputFileSync(path.join(workingDirectory, "examples/person.json"), JSON.stringify({ name: "Ada" }));

    const pluginManager = new RecordingPluginManager();
    await generate(config, pluginManager, createGenerationContext(config, workingDirectory));

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
    expect(pluginManager.invocation).toEqual({
      sourceFilePaths: ["schemas/person.yaml"],
      outputPath: "generated/plugin/example-plugin",
      options: { outputFormat: "compact" },
    });
    const firstGeneratedTree = readGeneratedTree(path.join(workingDirectory, "generated"));
    expect(firstGeneratedTree).toMatchSnapshot();

    await generate(config, new RecordingPluginManager(), createGenerationContext(config, workingDirectory));

    expect(readGeneratedTree(path.join(workingDirectory, "generated"))).toEqual(firstGeneratedTree);
  });

  test("supports absolute configured paths throughout generation", async () => {
    const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "spec-toolkit-absolute-"));
    testDirectories.push(testDirectory);
    const schemaPath = path.join(testDirectory, "input/person.yaml");
    const introPath = path.join(testDirectory, "input/person.intro.md");
    const outroPath = path.join(testDirectory, "input/person.outro.md");
    const examplesPath = path.join(testDirectory, "input/examples");
    const outputPath = path.join(testDirectory, "output");
    const config: SpecToolkitConfigurationDocument = {
      outputPath,
      docsConfig: [
        {
          type: "spec",
          id: "person",
          sourceFilePath: schemaPath,
          sourceIntroFilePath: introPath,
          sourceOutroFilePath: outroPath,
          examplesFolderPath: examplesPath,
        },
      ],
    };

    fs.outputFileSync(
      schemaPath,
      JSON.stringify({ ...personSchema, $id: "https://example.test/absolute-person.schema.json" }),
    );
    fs.outputFileSync(introPath, "# Absolute person specification\n");
    fs.outputFileSync(outroPath, "Absolute outro.\n");
    fs.outputFileSync(path.join(examplesPath, "person.json"), JSON.stringify({ name: "Ada" }));

    await generate(
      config,
      new PluginManager(),
      createGenerationContext(config, path.join(testDirectory, "unrelated-working-directory")),
    );

    expect(fs.readFileSync(path.join(outputPath, "docs/person.md"), "utf8")).toContain("Absolute person specification");
    expect(fs.readFileSync(path.join(outputPath, "docs/person.md"), "utf8")).toContain("Absolute outro.");
    expect(fs.readFileSync(path.join(outputPath, "docs/examples/person.md"), "utf8")).toContain('"name":"Ada"');
    expect(fs.existsSync(path.join(outputPath, "schemas/person.schema.json"))).toBe(true);
    expect(fs.existsSync(path.join(outputPath, "types/person.ts"))).toBe(true);
  });

  test("isolates plugin validation and preservation settings between generation runs", async () => {
    const workingDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "spec-toolkit-isolation-"));
    testDirectories.push(workingDirectory);
    const schemaPath = path.join(workingDirectory, "person.yaml");
    const pluginPath = path.join(workingDirectory, "test-plugin.mjs");
    fs.outputFileSync(
      schemaPath,
      JSON.stringify({
        ...personSchema,
        "x-test-property": true,
        properties: {
          name: { ...personSchema.properties.name, default: "Ada", "x-test-property": true },
        },
      }),
    );
    fs.outputFileSync(
      pluginPath,
      'export default class TestPlugin { get xProperties() { return ["x-test-property"]; } generate() {} }',
    );

    const createConfig = (outputPath: string, preserve: boolean): SpecToolkitConfigurationDocument => ({
      outputPath,
      docsConfig: [{ type: "spec", id: "person", sourceFilePath: schemaPath }],
      plugins: [
        {
          packageName: pluginPath,
          ...(preserve && { options: { preservedPluginSpecificXProperties: ["x-test-property"] } }),
        },
      ],
    });
    const firstConfig = createConfig("first-output", true);
    const firstContext = createGenerationContext(firstConfig, workingDirectory);
    await generate(firstConfig, await registerPlugins(firstConfig, firstContext), firstContext);

    const secondConfig = createConfig("second-output", false);
    const secondContext = createGenerationContext(secondConfig, workingDirectory);
    await generate(secondConfig, await registerPlugins(secondConfig, secondContext), secondContext);

    const firstSchema = JSON.parse(
      fs.readFileSync(path.join(workingDirectory, "first-output/schemas/person.schema.json"), "utf8"),
    ) as Record<string, unknown>;
    const secondSchema = JSON.parse(
      fs.readFileSync(path.join(workingDirectory, "second-output/schemas/person.schema.json"), "utf8"),
    ) as Record<string, unknown>;
    expect(firstSchema["x-test-property"]).toBe(true);
    expect(secondSchema["x-test-property"]).toBeUndefined();

    const thirdConfig: SpecToolkitConfigurationDocument = {
      outputPath: "third-output",
      docsConfig: [{ type: "spec", id: "person", sourceFilePath: schemaPath }],
    };
    const thirdContext = createGenerationContext(thirdConfig, workingDirectory);

    await expect(generate(thirdConfig, await registerPlugins(thirdConfig, thirdContext), thirdContext)).rejects.toThrow(
      /unknown keyword.*x-test-property/,
    );
  });
});

import path from "node:path";
import { createGenerationContext } from "./generationContext.js";
import { describe, expect, test } from "./testHelpers/nodeTest.js";

describe("GenerationContext", () => {
  test("resolves input and output paths from the invocation working directory", () => {
    const context = createGenerationContext({ outputPath: "generated/spec" }, "/workspace/project");

    expect(context.workingDirectory).toBe(path.resolve("/workspace/project"));
    expect(context.resolvePath("schemas/document.yaml")).toBe(path.resolve("/workspace/project/schemas/document.yaml"));
    expect(context.outputPath("docs", "document.md")).toBe(
      path.resolve("/workspace/project/generated/spec/docs/document.md"),
    );
    expect(context.displayPath(context.outputPath("docs", "document.md"))).toBe(
      path.join("generated", "spec", "docs", "document.md"),
    );
  });

  test("preserves absolute configured paths", () => {
    const outputPath = path.resolve("/tmp/spec-toolkit-output");
    const context = createGenerationContext({ outputPath }, "/workspace/project");

    expect(context.outputDirectory).toBe(outputPath);
    expect(context.outputPath("schemas", "document.json")).toBe(path.join(outputPath, "schemas", "document.json"));
    expect(context.displayPath(context.outputPath("schemas", "document.json"))).toBe(
      path.join(outputPath, "schemas", "document.json"),
    );
  });

  test("does not depend on later process working-directory changes", () => {
    const context = createGenerationContext({ outputPath: "generated" }, "/workspace/first");

    expect(context.resolvePath("schema.yaml")).toBe(path.resolve("/workspace/first/schema.yaml"));
    expect(Object.isFrozen(context)).toBe(true);
  });

  test("isolates validation and plugin configuration between runs", () => {
    const first = createGenerationContext({ outputPath: "generated" });
    const second = createGenerationContext({ outputPath: "generated" });

    first.preservedPluginSpecificXProperties.add("x-example");

    expect(first.validation.ajv === second.validation.ajv).toBe(false);
    expect(second.preservedPluginSpecificXProperties.has("x-example")).toBe(false);
  });
});
